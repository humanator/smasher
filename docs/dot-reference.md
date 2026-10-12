<!-- ABOUTME: Complete DOT pipeline reference for smasher-attractor. -->
<!-- ABOUTME: Documents node shapes, attributes, edge semantics, DOT syntax, and stylesheets. -->

# DOT Pipeline Reference

Smasher pipelines are standard DOT digraphs. The engine determines each node's
behavior from its `shape` attribute. This document covers all supported shapes,
attributes, edge semantics, and stylesheets.

## Node Shapes

The `shape` attribute on a DOT node determines its semantic type:

| Shape            | Node Type     | Purpose                                  |
|------------------|---------------|------------------------------------------|
| `circle`         | Start         | Pipeline entry point                     |
| `point`          | Start         | Alternative start marker                 |
| `Mdiamond`       | Start         | Alternative start marker                 |
| `doublecircle`   | Exit          | Pipeline terminal node                   |
| `Msquare`        | Exit          | Alternative exit marker                  |
| `diamond`        | Conditional   | Branch based on variable conditions      |
| `box`            | Codergen      | Run an LLM agent session                 |
| `rectangle`      | Codergen      | Alternative codergen marker              |
| `parallelogram`  | Tool          | Run a built-in tool or a shell command   |
| `hexagon`        | Interviewer   | Human interaction node                   |
| `oval`           | Interviewer   | Alternative interviewer marker           |
| `ellipse`        | Interviewer   | Alternative interviewer marker           |
| `component`      | Parallel      | Fan-out concurrent execution             |
| `tripleoctagon`  | FanIn         | Join parallel branches                   |
| `house`          | Manager       | Coordinator node                         |
| `folder`         | SubPipeline   | Nested DOT file                          |
| *(any other)*    | Generic       | Passthrough processing node              |

A node with no `shape` at all is Codergen. The mapping lives in
`node_type_from_shape` (`crates/smasher-attractor/src/graph/mod.rs`).

### Start (circle / point / Mdiamond)

Entry point for the pipeline. Every pipeline must have exactly one Start node.

```dot
start [shape=circle, label="Begin"];
```

### Exit (doublecircle / Msquare)

Terminal node. The pipeline stops when it reaches an Exit node. A pipeline can
have multiple Exit nodes for different outcomes.

```dot
done [shape=doublecircle, label="Success"];
failed [shape=doublecircle, label="Failed"];
```

### Conditional (diamond)

Evaluates a condition expression against the pipeline context. Routes along
outgoing edges labeled `success` or `failure`.

```dot
check [shape=diamond, label="Check Status", condition="status=ready"];
```

### Codergen (box / rectangle)

Runs an LLM agent session. The agent receives the `prompt` attribute as its
system instruction and uses the `model` attribute to select the LLM.

```dot
generate [
    shape=box,
    label="Generate Code",
    model="claude-sonnet-5",
    prompt="Write clean, tested code following the plan."
];
```

### Tool (parallelogram)

Runs a built-in tool or a shell command. A tool node sets exactly one of:

- `tool`: a built-in tool (`render_capture`, `system_lint`, `task_critic`,
  `synthesis`), with optional JSON `args`.
- `tool_command`: a shell command, run with `sh -c` in the run's working
  directory (the run directory, or the worktree under `smasher run
  --worktree`), with an optional `timeout`.

```dot
lint [shape=parallelogram, tool="system_lint", args="{\"candidate_dir\": \"candidates/a\"}"];

test [shape=parallelogram, tool_command="npm test", timeout="5m"];
```

A tool node never calls an LLM itself. Only `task_critic` and `synthesis`
make an LLM call, and only because the node names them. Setting neither
attribute, or both, fails the node, and `smasher lint` reports it (E004,
E005). The node's label is not used as a tool name. An unknown `tool` name
fails with a list of the built-ins.

A command succeeds when it exits 0. Any other exit code fails the node with
`exit code N: <end of stderr>`, and a timeout or cancellation kills the
command's whole process group. On success or failure, the command's result
is written to context for later conditions and nodes:

| Key              | Value                                                  |
|------------------|--------------------------------------------------------|
| `tool.output`    | stdout, trailing whitespace trimmed                    |
| `tool.stderr`    | stderr                                                 |
| `tool.exit_code` | the exit code as a string (`-1` after a timeout or cancel) |

Each value is capped at 100,000 bytes. The full streams are written to
`nodes/<id>/stdout.txt` and `stderr.txt` in the run directory. Branches of a
`Parallel` node share one context, so when several tool nodes run in a
fan-out, `tool.*` holds whichever finished last; each node's own result is
still in `_tool_<id>` and `nodes/<id>/`.

The command inherits the server's environment, minus variables whose names
look secret (containing `API_KEY`, `TOKEN`, `PASSWORD`, `SECRET` or
`AWS_SECRET`), plus:

| Variable              | Value                                             |
|-----------------------|---------------------------------------------------|
| `SMASHER_RUN_DIR`     | the run directory                                 |
| `SMASHER_NODE_ID`     | the node's id                                     |
| `SMASHER_CTX_<KEY>`   | each context value whose key doesn't start with `_`; the key is upper-cased, with every character outside `A-Z`, `0-9` and `_` replaced by `_` (`design.brief` → `SMASHER_CTX_DESIGN_BRIEF`) |

stdin is empty. A command that starts a background process should redirect
that process's output (`server > server.log 2>&1 &`); otherwise the node
waits for it until the timeout.

To fall back to an LLM when a command fails, say so in the graph:

```dot
check -> report [label="ok", condition="outcome=success"];
check -> fix    [label="failed", condition="outcome=fail"];
fix [shape=box, prompt="The checks failed. Read nodes/check/stderr.txt and fix the cause."];
```

### Interviewer (hexagon / oval / ellipse)

Human interaction node. Pauses the pipeline and asks the user a question.
Supports free-form input, predefined options, and yes/no approval.

```dot
ask_user [shape=hexagon, label="What should we name this?", question="Pick a name"];
```

### Parallel (component)

Fan-out node that dispatches downstream branches concurrently.

```dot
fan_out [shape=component, label="Fan Out", max_concurrency=3];
```

### FanIn (tripleoctagon)

Join node that collects the results of parallel branches.

```dot
join [shape=tripleoctagon, label="Join"];
```

### Manager (house)

Human gate / coordinator node. Similar to Interviewer but designed for
approval workflows. Reads the `question` attribute and presents it to the
operator.

```dot
gate [shape=house, label="Approval Gate", question="Do you approve?"];
```

### SubPipeline (folder)

References an external DOT file for inline composition.

### Generic (any other shape)

Passthrough processing node. Executes with whatever handler is registered for
the Generic type.

## DOT Language Syntax

Smasher uses a purpose-built recursive descent parser for the DOT language. The
supported subset includes:

### Graph Declaration

```dot
digraph PipelineName {
    // nodes and edges go here
}
```

The `strict` keyword is accepted but has no effect:

```dot
strict digraph PipelineName { ... }
```

Both `digraph` and `graph` keywords are accepted.

### Attribute Values

DOT attribute values support four types via automatic coercion:

| Type | Examples | Notes |
|------|----------|-------|
| String | `"hello"`, `"claude-sonnet-5"` | Quoted text |
| Number | `42`, `3.14` | Integer or floating-point |
| Duration | `"100ms"`, `"900s"`, `"5m"`, `"2h"` | Quoted string with unit suffix |
| Bool | `"true"`, `"false"` | Quoted strings coerced to boolean |

Duration values are automatically parsed when the string matches the pattern
`<number><suffix>` where suffix is one of `ms`, `s`, `m`, or `h`.

### Subgraphs

Subgraphs are supported for grouping nodes:

```dot
digraph Pipeline {
    subgraph cluster_prep {
        a -> b;
    }
    subgraph cluster_exec {
        c -> d;
    }
    b -> c;
}
```

### Node and Edge Defaults

Default attributes for all nodes or edges can be set:

```dot
digraph Pipeline {
    node [shape=box];       // all nodes default to Codergen
    edge [label="next"];    // all edges default to "next" label

    a -> b -> c;
}
```

## Node Attributes

All nodes support these common attributes:

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `label`                | string   | Display name shown in logs and prompts               |
| `class`                | string   | Space-separated class names for stylesheet matching  |

### Codergen Attributes

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `model`                | string   | LLM model identifier (e.g. `"claude-sonnet-5"`) |
| `prompt`               | string   | System instruction for the agent                     |

### Conditional Attributes

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `condition`            | string   | Expression evaluated against context (see below)     |

### Tool Attributes

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `tool`                 | string   | Built-in tool to run. Set this or `tool_command`, not both |
| `args`                 | string   | JSON-encoded arguments for a built-in `tool` (lint W004 if set with `tool_command`) |
| `tool_command`         | string   | Shell command to run with `sh -c` in the run's working directory |
| `timeout`              | number or duration | Seconds a `tool_command` may run: `600`, `"600"` or `"30s"`. Default 600 |

### Manager Attributes

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `task`                 | string   | Description of the task to coordinate (falls back to label) |
| `config`               | string   | JSON-encoded configuration for the manager           |

### Retry Attributes

Any node can have retry behavior:

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `retries`              | number   | Number of retries (total attempts = retries + 1)     |
| `retry_delay`          | duration | Base delay between retries (e.g. `"1s"`, `"500ms"`) |
| `max_retry_delay`      | duration | Upper bound on exponential backoff                   |
| `retry_jitter`         | boolean  | Randomize delay to avoid thundering herd             |

### Interviewer / Manager Attributes

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `question`             | string   | The question presented to the human                  |
| `prompt`               | string   | Alternative to `question` (Manager nodes)            |
| `options`              | string   | Comma-separated predefined choices                   |
| `approve`              | boolean  | If true, use yes/no approval mode                    |
| `human.timeout_secs`   | number   | Seconds to wait before timing out                    |
| `human.default_choice` | string   | Response to use when the interaction times out        |

### Parallel Attributes

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `max_concurrency`      | number   | Limit on concurrent branches (default: 10)           |
| `fail_fast`            | boolean  | Abort all branches on first failure                  |

## Edge Attributes

Edges control routing between nodes after execution.

| Attribute              | Type     | Description                                          |
|------------------------|----------|------------------------------------------------------|
| `label`                | string   | Outcome label for routing (see below)                |
| `condition`            | string   | Expression evaluated to determine if edge is taken   |
| `priority`             | number   | When multiple edges match, highest priority wins     |
| `loop_restart`         | boolean  | If true, traversing this edge restarts the target node |

### Edge Label Routing

Edge labels determine which outgoing path is taken after a node executes:

- **Success labels**: `success`, `yes`, `true` match successful outcomes
- **Failure labels**: `failure`, `error`, `no`, `false` match failure outcomes
- **Priority**: When multiple edges match, the one with the highest `priority`
  attribute wins (default priority is 0)

```dot
check -> happy [label="success"];
check -> sad   [label="failure"];
```

### Loop Restart

When an edge has `loop_restart=true`, traversing it:

1. Resets node-specific context entries for the target node
2. Increments an internal loop counter
3. Re-enters the target node for another iteration

This is distinct from the retry mechanism (which re-runs a node on transient failure).
Loop restarts are explicit graph-level iteration driven by conditional routing.

```dot
check -> process [label="failure", loop_restart=true];
```

The engine's `max_steps` limit (default 1000) prevents infinite loops.

## Condition Expressions

Conditional nodes and edge conditions evaluate expressions against the pipeline context.

### Operators

| Syntax               | Meaning                                     |
|----------------------|---------------------------------------------|
| `key=value`          | Equality: variable `key` equals `value`     |
| `key!=value`         | Inequality: variable `key` does not equal `value` |
| `key>N`              | Greater than: variable `key` is numerically > N |
| `key<N`              | Less than: variable `key` is numerically < N |
| `a=b && c=d`         | Logical AND: both conditions must be true   |
| `a=b \|\| c=d`      | Logical OR: at least one must be true       |
| `!condition`         | Logical NOT: inverts the condition          |
| `(grouped)`          | Parentheses for precedence                  |

### Examples

```dot
// Simple equality
check [shape=diamond, condition="status=ready"];

// Compound condition
gate [shape=diamond, condition="auth=valid && quota=ok"];

// Numeric comparison
limit [shape=diamond, condition="count>10"];

// Branch on a tool command's output
check -> clean [condition="context.tool.output=clean"];
```

### Keys and the `context.` prefix

A key is looked up in the pipeline context as written. If it isn't there and
starts with `context.`, the prefix is dropped and the key is looked up again,
so `context.tool.output=clean` and `tool.output=clean` are equivalent. A key
literally named `context.foo` still wins over `foo`. A key that isn't set
makes a comparison false.

After each node, `outcome` holds its result: `success` (including partial
success), `fail`, `retry` or `skip`.

## Stylesheets

Stylesheets modify graph node attributes before execution, allowing you to override
properties without editing the DOT file. They use a CSS-like syntax.

### Selectors

| Selector     | Matches                                          | Specificity |
|--------------|--------------------------------------------------|-------------|
| `*`          | All nodes                                        | 0 (lowest)  |
| `codergen`   | All nodes of that type                           | 1           |
| `.classname` | Nodes with matching `class` attribute            | 2           |
| `#node_id`   | The specific node with that ID                   | 3 (highest) |

### Value Types

| Type     | Examples                              |
|----------|---------------------------------------|
| String   | `"claude-sonnet-5"`          |
| Number   | `4096`, `0.7`                         |
| Boolean  | `true`, `false`                       |
| Duration | `30s`, `5m`, `2h`                     |

### Syntax

```css
/* Apply to all codergen nodes */
codergen {
    model: "claude-sonnet-5";
    max_tokens: 4096;
}

/* Apply to a specific node by ID */
#code_gen_1 {
    model: "claude-opus-4-20250514";
    temperature: 0.9;
}

/* Apply to nodes with a class */
.critical {
    retries: 3;
    retry_delay: 2s;
}

/* Apply to all nodes */
* {
    temperature: 0.5;
}
```

### Specificity Cascade

When multiple rules match a node, declarations are merged with higher-specificity
selectors overriding lower ones. Within the same specificity level, later rules
override earlier ones.

Order of precedence (lowest to highest):

1. `*` (wildcard)
2. Node type (e.g. `codergen`)
3. Class (e.g. `.critical`)
4. ID (e.g. `#code_gen_1`)

### Comments

Block comments are supported:

```css
/* This is a comment */
codergen {
    model: "claude-sonnet-5"; /* inline comment */
}
```

### Usage

Save your stylesheet to a file and pass it via `--stylesheet`:

```bash
smasher run pipeline.dot --stylesheet overrides.css
```

## Pipeline Output

The `smasher run` command prints the final pipeline context as pretty-printed JSON
to stdout. All variables (both input via `--var` and those set during execution) are
included.

## CLI Flags for `smasher run`

| Flag                  | Description                                         |
|-----------------------|-----------------------------------------------------|
| `<PIPELINE>`          | Path to the DOT pipeline file (positional, required) |
| `--var KEY=VALUE`     | Set a context variable (repeatable)                  |
| `--model MODEL`       | Model for codergen nodes (default: `claude-sonnet-5`) |
| `--max-steps N`       | Max node visits before forced stop (default: 1000)   |
| `--stylesheet PATH`   | Path to a stylesheet file for graph transforms       |

## Minimal Pipeline Template

```dot
digraph MyPipeline {
    start [shape=circle, label="Start"];
    done  [shape=doublecircle, label="Done"];
    start -> done;
}
```

Save this as `pipeline.dot` and run:

```bash
smasher run pipeline.dot
```

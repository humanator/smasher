// ABOUTME: Inline DOT graphs shared by the batch-2 Vitest and Playwright tests
// ABOUTME: None reaches an LLM: runs park on gates or fail on unparseable tool args

import * as runsApi from '../../src/lib/api/runs';

// Fails with an error, spending nothing: args are parsed before any tool or
// LLM runs, and with no outgoing edge the failure can't be routed, so the run
// is Failed with "node 'bad' failed with no available route: invalid JSON in
// args attribute: …".
export const RUN_FAIL_CHECK = `digraph RunFailCheck {
  start [shape=Mdiamond]; exit [shape=Msquare];
  bad [shape=parallelogram, tool="noop", args="{not json"];
  start -> bad;
}`;

// Fails at its tool step with exit status 3, after a checkpoint, so the run can be resumed. No LLM.
export const FAIL_TOOL = `digraph FailTool {
  start [shape=Mdiamond]; exit [shape=Msquare];
  work [shape=parallelogram, tool_command="exit 3"];
  start -> work;
  work -> exit [condition="outcome=success"];
}`;

// Finishes at once: start straight to exit.
export const QUICK_FINISH = `digraph QuickFinish {
  start [shape=Mdiamond]; exit [shape=Msquare];
  start -> exit;
}`;

// Stays Running with no question pending: a shell command that sleeps, no LLM.
export const SLEEPING = `digraph Sleeping {
  start [shape=Mdiamond]; exit [shape=Msquare];
  nap [shape=parallelogram, label="Take a nap", tool_command="sleep 60"];
  start -> nap -> exit;
}`;

// One gate of each kind, in order: multiple choice, approval, free form.
export const QUESTION_KINDS = `digraph QuestionKinds {
  start [shape=Mdiamond]; exit [shape=Msquare];
  pick [shape=hexagon, label="Pick a colour", options="Red, Blue, Green"];
  ok   [shape=hexagon, label="Continue?", approve=true];
  text [shape=hexagon, label="Say something"];
  start -> pick -> ok -> text -> exit;
}`;

// Answering "again" loops back once (loop_restarted, edge_traversed,
// checkpoint_created); answering "done" completes.
export const LOOP_CHECK = `digraph LoopCheck {
  start [shape=Mdiamond]; exit [shape=Msquare];
  gate [shape=hexagon, label="Again?", options="again, done"];
  start -> gate;
  gate -> start [label="again", loop_restart=true];
  gate -> exit  [label="done"];
}`;

// No graph name, so the run's graph_name is null.
export const ANONYMOUS_GATE = `digraph {
  start [shape=Mdiamond]; exit [shape=Msquare];
  g [shape=hexagon, label="x"];
  start -> g -> exit
}`;

// A gallery gate straight from start (no render nodes, so no browser), expecting two candidates.
// Its decisions are conditionals that pass the run on to exit, so a decision never reaches an LLM.
// Seed candidate manifests in the run's artifacts dir for it to find.
function galleryGate(edges: readonly string[], extra = ''): string {
  const targets = edges.map((edge) => `${edge}_to [shape=diamond]; gate -> ${edge}_to [label="${edge}"]; ${edge}_to -> exit;`);
  return `digraph GalleryGateCheck {
  start [shape=Mdiamond]; exit [shape=Msquare];
  gate [shape=hexagon, label="Pick a favourite", gallery="true", candidate_count=2];
  start -> gate;
  ${targets.join('\n  ')}
  ${extra}
}`;
}

// The edges the repo's own workflows use: proceed and iterate.
export const GALLERY_GATE = galleryGate(['proceed', 'iterate']);

// The two decisions the Decision bar knows by name.
export const GALLERY_GATE_APPROVE = galleryGate(['iterate', 'approve']);

// A third route beside the two known ones.
export const GALLERY_GATE_THREE_EDGES = galleryGate(['approve', 'iterate', 'skip']);

const submitted: string[] = [];

// Records a run started some other way (submitRun with variables,
// runWorkflow) so cancelAll() cleans it up too. Returns the id unchanged.
export function trackRun(runId: string): string {
  submitted.push(runId);
  return runId;
}

// Submits a graph and records its run id so cancelAll() can clean it up.
export async function submitGraph(dot: string): Promise<string> {
  const { run_id } = await runsApi.submitRun({ dot_source: dot, variables: {} });
  return trackRun(run_id);
}

// Cancels every run submitted or tracked so far. Call it in afterEach.
export async function cancelAll(): Promise<void> {
  const ids = submitted.splice(0);
  await Promise.all(ids.map((id) => runsApi.cancelRun(id).catch(() => undefined)));
}

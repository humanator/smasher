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

const submitted: string[] = [];

// Submits a graph and records its run id so cancelAll() can clean it up.
export async function submitGraph(dot: string): Promise<string> {
  const { run_id } = await runsApi.submitRun({ dot_source: dot, variables: {} });
  submitted.push(run_id);
  return run_id;
}

// Cancels every run submitted so far. Call it in afterEach.
export async function cancelAll(): Promise<void> {
  const ids = submitted.splice(0);
  await Promise.all(ids.map((id) => runsApi.cancelRun(id).catch(() => undefined)));
}

// ABOUTME: Decides what the run page's hero says: needs you, now running, finished, couldn't finish or stopped
// ABOUTME: Pure; takes the run, its steps, events, decisions and open questions and returns the words to show

import type { PipelineEvent } from './api/events';
import type { DecisionResponse, GraphNodeSummary, RunSummary } from './api/runs';
import { failureAdvice } from './failureAdvice';
import { currentStep, stepProgress } from './runProgress';
import { summariseRunError } from './runError';
import { stepKind } from './stepKinds';
import { formatDuration } from './timeFormat';
import { stepLabel } from './workflowSteps';

export type HeroModel =
  | { state: 'waiting'; eyebrow: string; heading: string }
  | { state: 'running'; heading: string; text: string; iterating: boolean }
  | { state: 'completed'; heading: string; text: string }
  | { state: 'failed'; heading: string; message: string | null; advice: string[] }
  | { state: 'aborted'; heading: string; text: string };

export interface HeroInputs {
  run: RunSummary;
  steps: readonly GraphNodeSummary[];
  events: readonly PipelineEvent[];
  decisions: readonly DecisionResponse[];
  /** The text of the question a person is being asked, when the run is waiting. */
  question: string | null;
  now: Date;
}

/** Step names by node id. */
export function stepLabels(steps: readonly GraphNodeSummary[]): Map<string, string> {
  return new Map(steps.map((s) => [s.id, stepLabel(s)]));
}

const NODE = /node '([^']+)'/;

function list(ids: readonly string[]): string {
  return ids.join(', ');
}

export function heroModel({ run, steps, events, decisions, question, now }: HeroInputs): HeroModel {
  const labels = stepLabels(steps);
  const name = (id: string) => labels.get(id) ?? id;
  const progress = stepProgress(steps, events);

  switch (run.status) {
    case 'Completed': {
      const approved = [...decisions].reverse().find((d) => d.decision === 'approve' && d.selected.length > 0);
      const count = steps.length || progress.length;
      return {
        state: 'completed',
        heading: `Finished in ${formatDuration(run.started_at, run.completed_at, now)}`,
        text: approved
          ? `You approved ${list(approved.selected)}. The workflow then ran to the end.`
          : `All ${count} steps ran to the end.`,
      };
    }
    case 'Failed': {
      const failedId = progress.find((p) => p.state === 'failed')?.id ?? NODE.exec(run.error ?? '')?.[1];
      const label = failedId ? name(failedId) : null;
      let message = summariseRunError(run.error, labels);
      // The heading already names the step.
      if (message && label && message.startsWith(`${label}: `)) message = message.slice(label.length + 2);
      return {
        state: 'failed',
        heading: label ? `${label} couldn't finish` : "This run couldn't finish",
        message,
        advice: failureAdvice(run.error),
      };
    }
    case 'Aborted':
      return { state: 'aborted', heading: 'Stopped by you', text: 'You stopped this run before it finished.' };
  }

  const waitingId = progress.find((p) => p.state === 'waiting')?.id;
  if (run.pending_questions > 0 || waitingId) {
    const kind = stepKind('Interviewer').plain;
    const gateId = waitingId ?? steps.find((s) => s.node_type === 'Interviewer')?.id;
    const gate = gateId ? name(gateId) : kind;
    return { state: 'waiting', eyebrow: `${gate} · ${kind}`, heading: question ?? gate };
  }

  const currentId = currentStep(progress);
  const node = steps.find((s) => s.id === currentId);
  const lastDecision = decisions[decisions.length - 1];
  if (lastDecision?.decision === 'iterate') {
    const back = [...events].reverse().find((e) => e.kind === 'loop_restarted');
    const target = back && back.kind === 'loop_restarted' ? name(back.to) : currentId ? name(currentId) : 'an earlier step';
    return {
      state: 'running',
      heading: 'Making new candidates from your notes',
      text: `Your decision was recorded. The workflow has gone back to ${target} for another round.`,
      iterating: true,
    };
  }
  return {
    state: 'running',
    heading: currentId ? name(currentId) : 'Getting started',
    text: node ? stepKind(node.node_type).blurb : 'The workflow is getting ready to run its first step.',
    iterating: false,
  };
}

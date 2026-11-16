// ABOUTME: Folds a run's pipeline events into one state per step for the Progress tab
// ABOUTME: Pure; the SSE history replay means a reloaded page rebuilds the same result

import type { PipelineEvent } from './api/events';
import { formatDuration } from './eventFormat';

export type StepState = 'pending' | 'running' | 'done' | 'failed' | 'waiting';

export interface StepProgress {
  id: string;
  state: StepState;
  /** How many times the step started. */
  runs: number;
  /** Total time across all runs of the step. */
  durationMs: number;
  /** How many times the workflow looped back to this step. */
  wentBack: number;
  /** A person has answered this step's question. */
  answered: boolean;
}

function fresh(id: string): StepProgress {
  return { id, state: 'pending', runs: 0, durationMs: 0, wentBack: 0, answered: false };
}

/**
 * One entry per step, in the order given. With no steps, the steps named in the
 * events are used instead, in the order they first appear. Identical events
 * (a replayed history) are counted once.
 */
export function stepProgress(
  steps: readonly { id: string }[],
  events: readonly PipelineEvent[]
): StepProgress[] {
  const table = new Map<string, StepProgress>(steps.map((s) => [s.id, fresh(s.id)]));
  const open = steps.length === 0;
  const seen = new Set<string>();

  const get = (id: string): StepProgress | undefined => {
    if (!table.has(id) && open) table.set(id, fresh(id));
    return table.get(id);
  };

  for (const event of events) {
    const key = JSON.stringify(event);
    if (seen.has(key)) continue;
    seen.add(key);

    switch (event.kind) {
      case 'node_started': {
        const step = get(event.node_id);
        if (step) {
          step.runs += 1;
          step.state = 'running';
        }
        break;
      }
      case 'node_completed': {
        const step = get(event.node_id);
        if (step) {
          step.state = 'done';
          step.durationMs += event.duration_ms;
        }
        break;
      }
      case 'node_failed': {
        const step = get(event.node_id);
        if (step) {
          step.state = 'failed';
          step.durationMs += event.duration_ms;
        }
        break;
      }
      case 'human_prompt_issued': {
        const step = get(event.node_id);
        if (step) step.state = 'waiting';
        break;
      }
      case 'human_response_received': {
        const step = get(event.node_id);
        if (step) {
          step.state = 'running';
          step.answered = true;
        }
        break;
      }
      case 'loop_restarted': {
        const step = get(event.to);
        if (step) step.wentBack += 1;
        break;
      }
      case 'pipeline_aborted':
        // Whatever was in flight didn't finish.
        for (const step of table.values()) {
          if (step.state === 'running' || step.state === 'waiting') step.state = 'pending';
        }
        break;
    }
  }
  return [...table.values()];
}

/** The step needing a person, else the first running one; null when nothing is in flight. */
export function currentStep(progress: readonly StepProgress[]): string | null {
  const active =
    progress.find((p) => p.state === 'waiting') ?? progress.find((p) => p.state === 'running');
  return active?.id ?? null;
}

export function doneCount(progress: readonly StepProgress[]): number {
  return progress.filter((p) => p.state === 'done').length;
}

/** Milliseconds from the first event to the run's last event, or to `now` while it is still going. */
export function elapsedMs(events: readonly PipelineEvent[], now: Date): number | null {
  if (events.length === 0) return null;
  const first = Date.parse(events[0].timestamp);
  const last = events[events.length - 1];
  const ended = last.kind === 'pipeline_completed' || last.kind === 'pipeline_aborted';
  return Math.max(0, (ended ? Date.parse(last.timestamp) : now.getTime()) - first);
}

const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth'];
const TIMES = ['', 'once', 'twice'];

function times(n: number): string {
  return TIMES[n] ?? `${n} times`;
}

/** The state-and-timing half of a step's meta line, e.g. "Ran twice · went back once". */
export function stepMeta(step: StepProgress): string {
  switch (step.state) {
    case 'pending':
      return step.runs > 0 ? 'Stopped before it finished' : 'Not started';
    case 'waiting':
      return 'Waiting for you';
    case 'failed':
      return 'Stopped with an error';
    case 'running':
      return step.runs > 1
        ? `${ORDINALS[step.runs] ?? `Run ${step.runs}`} run in progress`
        : 'Running';
    case 'done': {
      const time = formatDuration(step.durationMs);
      if (step.runs > 1) {
        return `Ran ${times(step.runs)} · ${step.wentBack > 0 ? `went back ${times(step.wentBack)}` : time}`;
      }
      return step.answered ? `Answered · ${time}` : time;
    }
  }
}

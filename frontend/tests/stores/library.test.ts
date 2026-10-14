// ABOUTME: Tests for the library store behind the sidebar: workflows, runs and what needs a person
// ABOUTME: Runs against the real backend using gate-only workflows that never reach an LLM

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createLibraryStore } from '../../src/stores/library.svelte';
import * as runsApi from '../../src/lib/api/runs';
import * as workflowsApi from '../../src/lib/api/workflows';
import * as questionsApi from '../../src/lib/api/questions';
import { setApiBaseUrl } from '../../src/lib/api/client-config';

const API_URL = 'http://127.0.0.1:21541/api';
const gateOnlyDot = readFileSync(join(process.cwd(), 'e2e', 'fixtures', 'gate_only.dot'), 'utf-8');

const launched: string[] = [];
const stores: ReturnType<typeof createLibraryStore>[] = [];

function track(store: ReturnType<typeof createLibraryStore>) {
  stores.push(store);
  return store;
}

async function until(check: () => boolean | Promise<boolean>, what: string): Promise<void> {
  for (let i = 0; i < 80; i++) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  expect.fail(`timed out waiting for ${what}`);
}

async function launchGateOnly(): Promise<string> {
  const { run_id } = await runsApi.submitRun({ dot_source: gateOnlyDot, variables: {} });
  launched.push(run_id);
  await until(async () => (await runsApi.getRun(run_id)).pending_questions === 1, 'the gate to open');
  return run_id;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('library store', () => {
  beforeAll(() => {
    setApiBaseUrl(API_URL);
  });

  afterEach(async () => {
    stores.splice(0).forEach((s) => s.stop());
    setHidden(false);
    setApiBaseUrl(API_URL);
    await Promise.all(launched.splice(0).map((id) => runsApi.cancelRun(id).catch(() => {})));
  });

  it('loads workflows and runs on refresh', async () => {
    const store = track(createLibraryStore());
    await store.refresh();
    expect(store.workflows.length).toBeGreaterThan(0);
    expect(Array.isArray(store.runs)).toBe(true);
  });

  it('puts exactly the running runs with a pending question in needsYou', async () => {
    const waiting = await launchGateOnly();
    const store = track(createLibraryStore());
    await store.refresh();

    expect(store.needsYou.map((r) => r.id)).toContain(waiting);
    for (const run of store.needsYou) {
      expect(run.status).toBe('Running');
      expect(run.pending_questions).toBeGreaterThan(0);
    }

    const { questions } = await questionsApi.listQuestions(waiting);
    await questionsApi.answerQuestion(waiting, questions[0].id, 'yes');
    await until(async () => (await runsApi.getRun(waiting)).pending_questions === 0, 'the answer to land');
    await store.refresh();
    expect(store.needsYou.map((r) => r.id)).not.toContain(waiting);
  });

  it('reports needs-you over running over null for a workflow', async () => {
    const { workflows } = await workflowsApi.listWorkflows();
    const workflow = workflows.find((w) => w.name === 'run_launch_check.dot');
    expect(workflow).toBeTruthy();
    const store = track(createLibraryStore());

    await store.refresh();
    const before = store.workflowState(workflow!.id);
    expect(before).toBeNull();

    const { run_id } = await runsApi.runWorkflow(workflow!.id, { variables: { brief: 'b' } });
    launched.push(run_id);
    await store.refresh();
    await until(async () => (await runsApi.getRun(run_id)).pending_questions === 1, 'the gate to open');
    await store.refresh();
    expect(store.workflowState(workflow!.id)).toBe('needs-you');

    await runsApi.cancelRun(run_id);
    await store.refresh();
    expect(store.workflowState(workflow!.id)).toBeNull();
    expect(store.workflowState('no-such-workflow')).toBeNull();
  });

  it('keeps the previous data when a poll fails', async () => {
    const store = track(createLibraryStore());
    await store.refresh();
    const workflows = store.workflows;
    expect(workflows.length).toBeGreaterThan(0);

    setApiBaseUrl('http://127.0.0.1:1/api');
    await store.refresh();
    expect(store.workflows).toBe(workflows);
  });

  it('polls on its interval, pauses while hidden and resumes when visible', async () => {
    const store = track(createLibraryStore(40));
    store.start();
    await until(() => store.workflows.length > 0, 'the first load');

    setHidden(true);
    const run = await launchGateOnly();
    await new Promise((r) => setTimeout(r, 300));
    expect(store.runs.map((r) => r.id)).not.toContain(run);

    setHidden(false);
    await until(() => store.runs.map((r) => r.id).includes(run), 'polling to resume');
    expect(store.needsYou.map((r) => r.id)).toContain(run);
  });

  it('stops polling after stop()', async () => {
    const store = track(createLibraryStore(40));
    store.start();
    await until(() => store.workflows.length > 0, 'the first load');
    store.stop();

    const run = await launchGateOnly();
    await new Promise((r) => setTimeout(r, 300));
    expect(store.runs.map((r) => r.id)).not.toContain(run);
  });
});

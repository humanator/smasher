// ABOUTME: Tests for RunDialog, the run-launch form: fields, validation, real launches and rejections
// ABOUTME: Launches only gate-only workflows against the REAL server; no mocked fetch

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import RunDialog from '../../../src/components/dashboard/RunDialog.svelte';
import { setApiBaseUrl } from '../../../src/lib/api/client-config';
import * as runsApi from '../../../src/lib/api/runs';
import * as questionsApi from '../../../src/lib/api/questions';
import * as workflowsApi from '../../../src/lib/api/workflows';
import { saveDraft } from '../../../src/lib/runDrafts';

const MARKER = '_test_run_launch_';
const SHAPE_ERROR = 'Expected {"step_id": {"model": "...", "provider": "..."}}';
const ADVANCED = 'Advanced: change the model for individual steps';

// Gate-only, so even a launch that shouldn't happen spends nothing.
const fixtureDot = readFileSync(
  join(process.cwd(), '..', 'examples', 'run_launch_check.dot'),
  'utf-8'
);

// Parses, so import accepts it, but has no exit node, so the launch's lint rejects it.
const lintFailingDot = 'digraph { Start [shape=Mdiamond] }';

let launched: string[] = [];

async function runLaunchCheck(): Promise<{ id: string; name: string }> {
  const { workflows } = await workflowsApi.listWorkflows();
  const workflow = workflows.find((w) => w.name === 'run_launch_check.dot');
  if (!workflow) throw new Error('examples/run_launch_check.dot is not in the catalog');
  return workflow;
}

// Imported under a unique name, so no other test file's runs share its workflow_id.
async function importWorkflow(dot: string): Promise<{ id: string; name: string }> {
  const name = `${MARKER}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { id } = await workflowsApi.importWorkflowDot(name, dot);
  return { id, name: `${name}.dot` };
}

function openDialog(workflow: { id: string; name: string }) {
  vi.stubGlobal('location', { href: '' });
  // Drafts outlive a test, and several tests share run_launch_check, so start each one blank.
  saveDraft(workflow.id, { model: '', variables: '', brief: '', nodeOverrides: '' });
  const user = userEvent.setup();
  const result = render(RunDialog, { props: { workflow, open: true } });
  return { user, ...result };
}

function field(label: string): HTMLInputElement | HTMLTextAreaElement {
  return screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;
}

// The test server always has the claude-cli provider, whose models are the Claude aliases.
async function pickModel(user: ReturnType<typeof userEvent.setup>, model: string) {
  const provider = (await screen.findByLabelText('Provider')) as HTMLSelectElement;
  await waitFor(() => expect(provider.querySelector('option[value="claude-cli"]')).toBeTruthy());
  await user.selectOptions(provider, 'claude-cli');
  await user.selectOptions(screen.getByLabelText('Model'), model);
}

async function waitForLaunch(): Promise<string> {
  await waitFor(() => expect(location.href).toMatch(/^\/runs\/[a-zA-Z0-9-]+$/), { timeout: 5000 });
  const runId = location.href.split('/')[2];
  launched.push(runId);
  return runId;
}

async function pendingQuestion(runId: string): Promise<string> {
  let question = '';
  await waitFor(
    async () => {
      const { questions } = await questionsApi.listQuestions(runId);
      expect(questions.length).toBeGreaterThan(0);
      question = questions[0].question;
    },
    { timeout: 5000 }
  );
  return question;
}

describe('RunDialog', () => {
  beforeAll(() => {
    setApiBaseUrl('http://127.0.0.1:21541/api');
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    // bits-ui's scroll lock clears this on a timer after the open dialog
    // unmounts; reset it so the next test's clicks aren't blocked.
    document.body.style.pointerEvents = '';
    await Promise.all(launched.map((id) => runsApi.cancelRun(id).catch(() => {})));
    launched = [];
    const { workflows } = await workflowsApi.listWorkflows();
    for (const w of workflows) {
      if (w.name.includes(MARKER)) rmSync(w.path, { force: true });
    }
  });

  it('shows the design\'s title, copy and fields: Brief, Model, Extra values', async () => {
    openDialog(await runLaunchCheck());

    expect(await screen.findByRole('heading', { name: 'Run “Run Launch Check”' })).toBeTruthy();
    expect(
      screen.getByText('Everything here is optional. Leave a field blank and the workflow uses its usual behaviour.')
    ).toBeTruthy();
    expect(field('Brief').getAttribute('placeholder')).toBe(
      'e.g. Three concepts for a mobile checkout that feels calmer'
    );
    expect(field('Brief')).toHaveAccessibleDescription(/passed to the workflow as a value called “brief”/);
    // One "Model" label only: the picker's own Model field carries the design's hint.
    expect(screen.getAllByText('Model', { exact: true })).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Model' })).toBeNull();
    expect(screen.getByLabelText('Model')).toHaveAccessibleDescription(
      'Which AI model to use for this run. Leave blank to use your default model from Settings.'
    );
    expect((screen.getByLabelText('Provider') as HTMLSelectElement).value).toBe('');
    expect(screen.getByRole('option', { name: 'Default model' })).toBeTruthy();
    expect(field('Extra values').getAttribute('placeholder')).toBe('audience=first-time buyers');
    expect(field('Extra values')).toHaveAccessibleDescription(/one per line as name=value/);
    expect(screen.getByRole('button', { name: 'Start Run' })).toBeTruthy();
  });

  it('hides Step overrides behind the Advanced disclosure until it is opened', async () => {
    const { user } = openDialog(await runLaunchCheck());
    const advanced = await screen.findByRole('button', { name: ADVANCED });

    expect(advanced).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Step overrides (JSON)')).toBeNull();

    await user.click(advanced);

    expect(advanced).toHaveAttribute('aria-expanded', 'true');
    expect(field('Step overrides (JSON)').getAttribute('placeholder')).toBe(
      '{"draft_concepts": {"model": "claude-opus-4-20250514"}}'
    );
    expect(field('Step overrides (JSON)')).toHaveAccessibleDescription(/for this run only/);
  });

  describe('closing without launching', () => {
    async function expectNoRun(workflowId: string) {
      const { runs } = await runsApi.listRuns();
      expect(runs.filter((r) => r.workflow_id === workflowId)).toEqual([]);
    }

    it('Cancel closes it and sends no request', async () => {
      const workflow = await importWorkflow(fixtureDot);
      const { user } = openDialog(workflow);

      await user.type(await screen.findByLabelText('Brief'), 'not sent');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByLabelText('Brief')).toBeNull());
      await expectNoRun(workflow.id);
    });

    it('Escape closes it and sends no request', async () => {
      const workflow = await importWorkflow(fixtureDot);
      const { user } = openDialog(workflow);

      await user.type(await screen.findByLabelText('Brief'), 'not sent');
      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByLabelText('Brief')).toBeNull());
      await expectNoRun(workflow.id);
    });

    it('the close button closes it and sends no request', async () => {
      const workflow = await importWorkflow(fixtureDot);
      const { user } = openDialog(workflow);

      await user.click(await screen.findByRole('button', { name: 'Close' }));

      await waitFor(() => expect(screen.queryByLabelText('Brief')).toBeNull());
      await expectNoRun(workflow.id);
    });
  });

  describe('validation', () => {
    it('shows a bad Variables line under its field, blocks submit, and clears on edit', async () => {
      const workflow = await importWorkflow(fixtureDot);
      const { user } = openDialog(workflow);

      await user.type(await screen.findByLabelText('Extra values'), 'a=1{Enter}colour blue');
      await user.click(screen.getByRole('button', { name: 'Start Run' }));

      const error = await screen.findByText('Line 2: write it as name=value');
      expect(field('Extra values').getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
      expect(field('Extra values').getAttribute('aria-invalid')).toBe('true');
      expect(location.href).toBe('');

      await user.type(field('Extra values'), 'x');
      expect(screen.queryByText('Line 2: write it as name=value')).toBeNull();
      expect(field('Extra values').getAttribute('aria-invalid')).toBeNull();

      const { runs } = await runsApi.listRuns();
      expect(runs.filter((r) => r.workflow_id === workflow.id)).toEqual([]);
    });

    it('shows invalid JSON and wrong-shape Step overrides errors under their field', async () => {
      const { user } = openDialog(await runLaunchCheck());
      await user.click(await screen.findByRole('button', { name: ADVANCED }));
      const overrides = await screen.findByLabelText('Step overrides (JSON)');

      await user.type(overrides, '{{nope');
      await user.click(screen.getByRole('button', { name: 'Start Run' }));
      const invalid = await screen.findByText(/^That is not valid JSON yet \(/);
      expect(overrides.getAttribute('aria-describedby')?.split(' ')).toContain(invalid.id);

      await user.clear(overrides);
      expect(screen.queryByText(/^That is not valid JSON yet \(/)).toBeNull();

      await user.type(overrides, '{{"a": "m"}');
      await user.click(screen.getByRole('button', { name: 'Start Run' }));
      expect(await screen.findByText(SHAPE_ERROR)).toBeTruthy();
      expect(location.href).toBe('');
    });

    it('shows both errors at once when both fields are bad', async () => {
      const { user } = openDialog(await runLaunchCheck());

      await user.type(await screen.findByLabelText('Extra values'), 'oops');
      await user.click(screen.getByRole('button', { name: ADVANCED }));
      await user.type(field('Step overrides (JSON)'), '[[]'); // '[[' types a literal '['
      await user.click(screen.getByRole('button', { name: 'Start Run' }));

      expect(await screen.findByText('Line 1: write it as name=value')).toBeTruthy();
      expect(screen.getByText(SHAPE_ERROR)).toBeTruthy();
      expect(location.href).toBe('');
    });
  });

  describe('launching', () => {
    it('sends what was typed and opens the new run', async () => {
      const workflow = await runLaunchCheck();
      const { user } = openDialog(workflow);

      await pickModel(user, 'claude-opus');
      await user.type(field('Extra values'), 'colour=blue');
      await user.type(field('Brief'), 'hello');
      await user.click(screen.getByRole('button', { name: 'Start Run' }));

      const runId = await waitForLaunch();
      expect((await runsApi.getRun(runId)).workflow_id).toBe(workflow.id);
      expect(await pendingQuestion(runId)).toBe('Brief: hello | Model: claude-opus | Colour: blue');
    });

    it('leaves a blank Model out so the server default applies', async () => {
      const { user } = openDialog(await runLaunchCheck());

      await user.type(await screen.findByLabelText('Brief'), 'default model');
      await user.click(screen.getByRole('button', { name: 'Start Run' }));

      const question = await pendingQuestion(await waitForLaunch());
      const model = question.match(/\| Model: (.*) \| Colour:/)?.[1];
      expect(model).toBeTruthy();
      expect(model!.trim()).not.toBe('');
      expect(model).not.toBe('{{model}}');
    });

    it('shows Starting… and disables Run while the request is in flight', async () => {
      openDialog(await runLaunchCheck());

      // fireEvent returns after Svelte flushes, well before the network round trip.
      await fireEvent.click(await screen.findByRole('button', { name: 'Start Run' }));
      const button = screen.getByRole('button', { name: 'Starting…' }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      await waitForLaunch();
    });

    it('keeps the dialog open with its values and shows the server message on rejection', async () => {
      const workflow = await importWorkflow(lintFailingDot);
      const { user } = openDialog(workflow);

      await pickModel(user, 'claude-opus');
      await user.type(field('Brief'), 'kept');
      await user.click(screen.getByRole('button', { name: 'Start Run' }));

      const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
      expect(alert.textContent).toContain('Pipeline lint errors: Graph has no exit node');
      expect(location.href).toBe('');
      expect((screen.getByLabelText('Model') as HTMLSelectElement).value).toBe('claude-opus');
      expect(field('Brief').value).toBe('kept');
      expect((screen.getByRole('button', { name: 'Start Run' }) as HTMLButtonElement).disabled).toBe(
        false
      );

      // Editing clears the stale server message.
      await user.type(field('Brief'), '!');
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('keeps typed values across close and reopen, but drops errors', async () => {
    const workflow = await importWorkflow(fixtureDot);
    const { user, rerender } = openDialog(workflow);

    await pickModel(user, 'claude-opus');
    await user.type(field('Extra values'), 'bad line');
    await user.type(field('Brief'), 'kept brief');
    await user.click(screen.getByRole('button', { name: ADVANCED }));
    await user.type(field('Step overrides (JSON)'), '{{}');
    await user.click(screen.getByRole('button', { name: 'Start Run' }));
    expect(await screen.findByText('Line 1: write it as name=value')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByLabelText('Brief')).toBeNull());

    // The parent reopens it, as the catalog does through bind:open.
    await rerender({ workflow, open: false });
    await rerender({ workflow, open: true });

    await waitFor(() =>
      expect((screen.getByLabelText('Provider') as HTMLSelectElement).value).toBe('claude-cli')
    );
    expect((screen.getByLabelText('Model') as HTMLSelectElement).value).toBe('claude-opus');
    expect(field('Extra values').value).toBe('bad line');
    expect(field('Brief').value).toBe('kept brief');
    // Restored overrides reopen the disclosure, so they're never hidden.
    expect(screen.getByRole('button', { name: ADVANCED })).toHaveAttribute('aria-expanded', 'true');
    expect(field('Step overrides (JSON)').value).toBe('{}');
    expect(screen.queryByText('Line 1: write it as name=value')).toBeNull();
  });

  it('depends on nothing from the catalog, so workflow-detail can mount it as is', () => {
    const source = readFileSync(
      join(process.cwd(), 'src', 'components', 'dashboard', 'RunDialog.svelte'),
      'utf-8'
    );
    expect(source).not.toContain('WorkflowCatalog');
  });

  it('keeps each workflow\'s values separate', async () => {
    const first = await importWorkflow(fixtureDot);
    const second = await importWorkflow(fixtureDot);
    const { user, rerender } = openDialog(first);

    await user.type(await screen.findByLabelText('Brief'), 'first only');
    await rerender({ workflow: second, open: false });
    await rerender({ workflow: second, open: true });

    expect(field('Brief').value).toBe('');
  });
});

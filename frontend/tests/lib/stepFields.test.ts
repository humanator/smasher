// ABOUTME: Tests for the step field catalogue the inspector and Step guide read their copy from
// ABOUTME: Covers every step kind, connections, rule syntax and the empty inspector, against Main board copy

import { describe, it, expect } from 'vitest';
import { STEP_GROUPS } from '../../src/lib/stepKinds';
import {
  stepFields,
  KIND_NOTES,
  TOOL_MODES,
  BUILT_IN_TOOLS,
  ANSWER_MODES,
  CONNECTION_FIELDS,
  CONNECTION_ABOUT,
  RULE_SYNTAX,
  NOTHING_SELECTED,
  branchRuleField,
  priorityError,
  jsonError,
  type FieldSpec,
} from '../../src/lib/stepFields';

const HANDLERS = STEP_GROUPS.flatMap((g) => g.kinds);
const NO_MORE_SETTINGS = ['Start', 'Exit', 'Conditional'];

function field(handler: string, attr: string): FieldSpec {
  const found = stepFields(handler).find((f) => f.attr === attr);
  expect(found, `${handler}.${attr}`).toBeDefined();
  return found!;
}

describe('stepFields', () => {
  it.each(HANDLERS)('%s has an entry that starts with Step name', (handler) => {
    const [first] = stepFields(handler);
    expect(first).toMatchObject({ attr: 'label', label: 'Step name', control: 'text' });
    expect(first.advanced).toBeFalsy();
  });

  it.each(HANDLERS)('%s has unique attrs', (handler) => {
    const attrs = stepFields(handler).map((f) => f.attr);
    expect(new Set(attrs).size).toBe(attrs.length);
  });

  it.each(HANDLERS.filter((h) => !NO_MORE_SETTINGS.includes(h)))('%s has the retry group under More settings', (handler) => {
    const advanced = stepFields(handler).filter((f) => f.advanced).map((f) => f.attr);
    expect(advanced.slice(-4)).toEqual(['max_retries', 'retry_delay', 'max_retry_delay', 'retry_jitter']);
  });

  it.each(NO_MORE_SETTINGS)('%s has no More settings', (handler) => {
    expect(stepFields(handler).filter((f) => f.advanced)).toEqual([]);
  });

  it('puts advanced fields after the visible ones', () => {
    for (const handler of HANDLERS) {
      const flags = stepFields(handler).map((f) => !!f.advanced);
      expect(flags, handler).toEqual([...flags].sort((a, b) => Number(a) - Number(b)));
    }
  });

  it('counts More settings per kind', () => {
    const counts = Object.fromEntries(HANDLERS.map((h) => [h, stepFields(h).filter((f) => f.advanced).length]));
    expect(counts).toEqual({
      Codergen: 4, Manager: 4, Tool: 4, Interviewer: 4, Conditional: 0,
      Parallel: 4, FanIn: 4, SubPipeline: 4, Start: 0, Exit: 0,
    });
  });

  it('writes Retries to max_retries and never to retries', () => {
    for (const handler of HANDLERS) {
      expect(stepFields(handler).map((f) => f.attr), handler).not.toContain('retries');
    }
    expect(field('Codergen', 'max_retries')).toMatchObject({
      label: 'Retries',
      placeholder: '0',
      help: 'How many extra attempts to make if the step fails.',
      control: 'text',
      advanced: true,
    });
  });

  it('adds the Commands row to Retries only for a Tool', () => {
    expect(field('Tool', 'max_retries').more?.map((r) => r.title)).toEqual([
      'Total attempts',
      'Not the same as “Go back and redo”',
      'Commands',
    ]);
    expect(field('Tool', 'max_retries').more?.[2].text).toBe('A shell command that fails is not retried automatically.');
    expect(field('Codergen', 'max_retries').more?.map((r) => r.title)).toEqual([
      'Total attempts',
      'Not the same as “Go back and redo”',
    ]);
  });

  it('has the rest of the retry group copy', () => {
    expect(field('Parallel', 'retry_delay')).toMatchObject({
      label: 'Wait between attempts',
      placeholder: '1s',
      help: 'The starting pause before the next attempt, for example 500ms or 1s. It grows after each failed attempt.',
    });
    expect(field('Parallel', 'max_retry_delay')).toMatchObject({ label: 'Longest wait', placeholder: '30s', help: 'Caps how long the pause can grow.' });
    expect(field('Parallel', 'retry_jitter')).toMatchObject({
      label: 'Randomise the wait',
      control: 'switch',
      help: 'Adds a little randomness so lots of retries do not all fire at the same moment.',
    });
  });

  it('ships no New badges', () => {
    for (const handler of HANDLERS) {
      for (const f of stepFields(handler)) expect(JSON.stringify(f), `${handler}.${f.attr}`).not.toMatch(/"New"/);
    }
  });

  it('marks exactly the board’s Required fields', () => {
    const required = HANDLERS.flatMap((h) => stepFields(h).filter((f) => f.required).map((f) => `${h}.${f.attr}`));
    expect(required.sort()).toEqual(['Interviewer.options', 'SubPipeline.pipeline', 'Tool.tool', 'Tool.tool_command']);
  });

  it('falls back to just Step name for an unknown handler', () => {
    expect(stepFields('Mystery').map((f) => f.attr)).toEqual(['label']);
  });

  describe('Step name help', () => {
    it.each([
      ['Codergen', 'Shown on the canvas and in run logs. If Instructions is empty, this name is used as the instruction.'],
      ['Manager', 'Shown on the canvas and in run logs. If Task is empty, this name is used as the task.'],
      ['Interviewer', 'Shown on the canvas and in run logs. If Question is empty, this name is used as the question.'],
      ['Tool', 'Shown on the canvas and in run logs.'],
      ['Conditional', 'Shown on the canvas and in run logs.'],
    ])('%s', (handler, help) => {
      expect(field(handler, 'label').help).toBe(help);
    });
  });

  describe('AI Agent', () => {
    it('lists Instructions then Model', () => {
      expect(stepFields('Codergen').filter((f) => !f.advanced).map((f) => f.attr)).toEqual(['label', 'prompt', 'model']);
    });

    it('has the Instructions copy', () => {
      expect(field('Codergen', 'prompt')).toEqual({
        attr: 'prompt',
        label: 'Instructions',
        control: 'textarea',
        rows: 7,
        help: 'Tell the AI what to do, as if briefing a colleague: the goal, what it should look at, and what a good result looks like.',
        placeholder: 'e.g. Read the brief and draft three concepts…',
        more: [
          { title: 'Example', text: 'Read the design brief and produce three distinct concepts as self-contained HTML files. Explain the idea behind each in one sentence.' },
          { title: 'If left blank', text: 'The step name is used instead. If both are empty the run fails with “no prompt specified”.' },
          { title: 'Tip', text: 'Name the files or folders you expect it to read and write.' },
        ],
      });
    });

    it('keeps ModelPicker for Model, with no free-text chips (D2)', () => {
      const model = field('Codergen', 'model');
      expect(model).toMatchObject({
        control: 'model',
        label: 'Model',
        help: 'Which AI model does this step’s work. Leave blank to use the workflow’s default.',
      });
      expect(model.tryChips).toBeUndefined();
      expect(model.more?.map((r) => r.title)).toEqual(['If left blank', 'Good to know']);
    });
  });

  describe('AI Coordinator', () => {
    it('lists Task, Settings (JSON) and Model', () => {
      expect(stepFields('Manager').filter((f) => !f.advanced).map((f) => f.attr)).toEqual(['label', 'task', 'config', 'model']);
    });

    it('has the Task chips and the JSON settings copy', () => {
      expect(field('Manager', 'task')).toMatchObject({
        label: 'Task',
        control: 'text',
        placeholder: 'e.g. coordinate-review',
        help: 'What should the coordinator work out? Write it in plain language. It is sent to the AI as-is.',
        tryChips: ['coordinate-review', 'delegate-subtask', 'aggregate-results', 'escalate-to-human'],
      });
      expect(field('Manager', 'config')).toMatchObject({
        label: 'Settings (JSON)',
        control: 'code',
        rows: 4,
        placeholder: '{ }',
        help: 'Optional extra settings for the coordinator, written as JSON. Leave blank for none.',
        more: [
          { title: 'If left blank', text: 'Treated as empty settings: {}.' },
          { title: 'If it is not valid JSON', text: 'The step fails when it runs. The app flags it here first.' },
        ],
      });
    });
  });

  describe('Tool', () => {
    it('lists the mode, both modes’ fields and Model', () => {
      expect(stepFields('Tool').filter((f) => !f.advanced).map((f) => f.attr)).toEqual([
        'label', 'tool_mode', 'tool', 'args', 'model', 'tool_command', 'timeout',
      ]);
    });

    it('asks what the step should run, as a choice it derives rather than writes', () => {
      expect(field('Tool', 'tool_mode')).toMatchObject({
        label: 'What should this step run?',
        help: 'Choose one. A step cannot do both.',
        control: 'choice',
        derived: true,
        options: TOOL_MODES,
      });
      expect(TOOL_MODES).toEqual([
        { value: 'builtin', title: 'Built-in tool', desc: 'A ready-made check or capture from Smasher.' },
        { value: 'command', title: 'Shell command', desc: 'Any command on your computer.' },
      ]);
    });

    it('offers the four built-in tools with their descriptions', () => {
      expect(field('Tool', 'tool')).toMatchObject({ label: 'Tool', required: true, help: 'Pick the built-in tool to run.', options: BUILT_IN_TOOLS });
      expect(BUILT_IN_TOOLS).toEqual([
        { value: 'render_capture', title: 'Screenshot a design', desc: 'Renders a candidate in a headless browser and saves screenshots and a manifest.' },
        { value: 'system_lint', title: 'Design-system check', desc: 'Checks a candidate against the design system’s rules. No AI involved.' },
        { value: 'task_critic', title: 'Usability critique', desc: 'One AI call that reviews a candidate the way a persona-based usability critic would.' },
        { value: 'synthesis', title: 'Summarise critiques', desc: 'One AI call that merges earlier critiques into a single set of recommendations.' },
      ]);
    });

    it('has the Command and Time limit copy', () => {
      expect(field('Tool', 'tool_command')).toMatchObject({
        label: 'Command',
        control: 'code',
        required: true,
        placeholder: 'e.g. npm test',
        help: 'The command to run, from the run’s working folder. It succeeds only if it finishes with exit code 0.',
      });
      expect(field('Tool', 'tool_command').more?.[1]).toEqual({
        title: 'What you can use afterwards',
        text: 'Later steps and rules can read what it printed (tool.output), its errors (tool.stderr) and its exit code (tool.exit_code).',
      });
      expect(field('Tool', 'timeout')).toMatchObject({
        label: 'Time limit',
        placeholder: '600',
        help: 'How long the command may run before it is stopped.',
        more: [
          { title: 'Examples', text: '600 (seconds), 30s, 5m' },
          { title: 'If left blank', text: '10 minutes (600 seconds).' },
          { title: 'If it runs out', text: 'The command is stopped and the step fails with “timed out”.' },
        ],
      });
      expect(field('Tool', 'args')).toMatchObject({ label: 'Tool settings (JSON)', control: 'code', help: 'Optional settings for the tool, written as JSON.' });
    });
  });

  describe('Ask a person', () => {
    it('lists Question, the answer mode, Options, the gallery and its count, then More settings', () => {
      expect(stepFields('Interviewer').map((f) => f.attr)).toEqual([
        'label', 'question', 'answer_mode', 'options', 'gallery', 'candidate_count',
        'max_retries', 'retry_delay', 'max_retry_delay', 'retry_jitter',
      ]);
    });

    it('has the three answer modes', () => {
      expect(field('Interviewer', 'answer_mode')).toMatchObject({
        label: 'How should they answer?',
        help: 'Choose the kind of answer you need back.',
        control: 'choice',
        derived: true,
        options: ANSWER_MODES,
      });
      expect(ANSWER_MODES).toEqual([
        { value: 'freeform', title: 'Free text', desc: 'Type anything, or choose from a gallery of candidates.' },
        { value: 'approve', title: 'Yes or no', desc: 'A simple approval.' },
        { value: 'options', title: 'Pick from a list', desc: 'Choose one of the options you write.' },
      ]);
    });

    it('has the gallery copy', () => {
      expect(field('Interviewer', 'gallery')).toMatchObject({
        label: 'Show a gallery of candidates',
        control: 'switch',
        help: 'Lets the person look through generated designs, choose favourites and add comments. Only works with free text answers.',
      });
      expect(field('Interviewer', 'candidate_count')).toMatchObject({ label: 'Candidates to expect', placeholder: '3' });
      expect(field('Interviewer', 'options')).toMatchObject({ label: 'Options', placeholder: 'approve, revise, reject', help: 'Separate the choices with commas.' });
    });
  });

  it('leaves out the human.* wait settings the engine no longer reads', () => {
    const attrs = stepFields('Interviewer').map((f) => f.attr);
    expect(attrs).not.toContain('human.timeout_secs');
    expect(attrs).not.toContain('human.default_choice');
  });

  describe('flow kinds', () => {
    it('Nested workflow asks for a file', () => {
      expect(field('SubPipeline', 'pipeline')).toMatchObject({
        label: 'Workflow file',
        placeholder: 'examples/sub_flow.dot',
        help: 'The path to the workflow (.dot file) to run as part of this one.',
      });
    });

    it('Split has At most at once and Stop everything if one fails', () => {
      expect(stepFields('Parallel').filter((f) => !f.advanced).map((f) => f.attr)).toEqual(['label', 'max_concurrency', 'fail_fast']);
      expect(field('Parallel', 'max_concurrency')).toMatchObject({ label: 'At most at once', placeholder: '10', help: 'Limits how many paths run at the same time.' });
      expect(field('Parallel', 'fail_fast')).toMatchObject({
        label: 'Stop everything if one fails',
        control: 'switch',
        more: [{ title: 'If off', text: 'Every path finishes, even if some fail. This is the default.' }],
      });
    });

    it.each(['FanIn', 'Conditional', 'Start', 'Exit'])('%s has only Step name visible', (handler) => {
      expect(stepFields(handler).filter((f) => !f.advanced).map((f) => f.attr)).toEqual(['label']);
    });

    it('has the per-kind notes', () => {
      expect(KIND_NOTES).toEqual({
        FanIn: 'This step has no settings. It waits for the paths started by a Split. If several of them save the same value, the last one to finish wins.',
        Start: 'This step has no settings beyond its name.',
        Exit: 'This step has no settings beyond its name.',
        Conditional:
          'A branch has no rule of its own. Each path leaving it carries a rule, and the workflow follows the first path whose rule is true (the highest priority wins a tie). Edit those rules here, or select a connection on the canvas.',
      });
    });
  });
});

describe('connection fields', () => {
  it('lists Label, Take this path when…, Priority and Go back and redo', () => {
    expect(CONNECTION_FIELDS.map((f) => [f.attr, f.label, f.control])).toEqual([
      ['label', 'Label', 'text'],
      ['condition', 'Take this path when…', 'text'],
      ['priority', 'Priority', 'text'],
      ['loop_restart', 'Go back and redo', 'switch'],
    ]);
  });

  it('has the board copy for each field', () => {
    const [label, condition, priority, loop] = CONNECTION_FIELDS;
    expect(label).toMatchObject({
      placeholder: 'e.g. Yes, continue',
      help: 'The name shown on the connection. Labels like success, yes or true also tell the workflow this path is for a good result; failure, error, no or false for a bad one.',
    });
    expect(condition).toMatchObject({
      placeholder: 'e.g. outcome=success',
      help: 'A rule that must be true for the workflow to follow this connection. If left blank, the label is used.',
      tryChips: ['outcome=success', 'outcome=fail'],
      more: [
        { title: 'Examples', text: 'outcome=success · status!=ready · count>10 · auth=valid && quota=ok' },
        { title: 'Reading saved values', text: 'Use the name of any saved value, such as tool.output. A value that was never saved makes the rule false.' },
        { title: 'Need the full syntax?', text: 'Open “Rule syntax” below.' },
      ],
    });
    expect(priority).toMatchObject({
      placeholder: '0',
      help: 'If more than one connection’s rule is true, the highest number wins. Whole numbers only. The default is 0.',
    });
    expect(loop).toMatchObject({
      help: 'When on, following this connection clears the target step’s saved results and runs it again from scratch. Use it for “try again” loops.',
      more: [
        { title: 'Not the same as retries', text: 'Retries re-run a step after a failure. This is a deliberate loop you draw on the canvas.' },
        { title: 'Safety stop', text: 'A run stops after 1000 step visits, so a loop can never run forever.' },
      ],
    });
    for (const f of CONNECTION_FIELDS) expect(f.required).toBeFalsy();
  });

  it('has the five About this connection sections', () => {
    expect(CONNECTION_ABOUT).toEqual([
      ['What it does', 'A connection decides what runs next. When a step finishes, the workflow follows the connection whose rule matches.'],
      ['Rules', 'A rule can look at how the previous step went (outcome) or at any saved value. With no rule, the connection is always allowed.'],
      ['Labels', 'Labels success, yes or true match a good result. Labels failure, error, no or false match a bad one.'],
      ['When more than one matches', 'The connection with the highest priority wins. The default priority is 0.'],
      ['Loops', 'Turn on Go back and redo to run the target step again from scratch. Loops are drawn dashed on the canvas.'],
    ]);
  });
});

describe('priorityError', () => {
  it.each(['', '0', '1', '5', '-3', '42'])('accepts %j', (value) => {
    expect(priorityError(value)).toBe('');
  });

  it.each(['1.5', 'x', ' ', '1e3', '+1', '--1'])('rejects %j with the board message', (value) => {
    expect(priorityError(value)).toBe('Priority must be a whole number, like 1 or 5.');
  });
});

describe('jsonError', () => {
  it.each(['', '   ', '{}', '{"candidate_dir": "candidates/a"}', '[1, 2]'])('accepts %j', (value) => {
    expect(jsonError(value)).toBe('');
  });

  it('quotes the parser message in the board sentence', () => {
    let parserMessage = '';
    try {
      JSON.parse('{bad');
    } catch (e) {
      parserMessage = (e as Error).message;
    }
    expect(jsonError('{bad')).toBe(`That is not valid JSON yet (${parserMessage}). The step would fail when it runs.`);
  });
});

describe('RULE_SYNTAX', () => {
  it('has the eight rows in board order', () => {
    expect(RULE_SYNTAX.rows).toEqual([
      { code: 'status=ready', text: 'equals' },
      { code: 'status!=ready', text: 'does not equal' },
      { code: 'count>10', text: 'greater than (numbers)' },
      { code: 'count<10', text: 'less than (numbers)' },
      { code: 'a=1 && b=2', text: 'both must be true' },
      { code: 'a=1 || b=2', text: 'either can be true' },
      { code: '!a=1', text: 'not' },
      { code: '(a=1 || b=2) && c=3', text: 'group with brackets' },
    ]);
  });

  it('has the footer, with its code words marked', () => {
    expect(RULE_SYNTAX.title).toBe('Rule syntax');
    expect(RULE_SYNTAX.footer).toEqual([
      'After every step, ', { code: 'outcome' }, ' is ', { code: 'success' }, ', ', { code: 'fail' }, ', ',
      { code: 'retry' }, ' or ', { code: 'skip' }, '. A value that was never saved makes a rule false.',
    ]);
  });
});

describe('NOTHING_SELECTED', () => {
  it('has the heading, the explanation and the four steps of How a workflow runs', () => {
    expect(NOTHING_SELECTED.heading).toBe('Nothing selected');
    expect(NOTHING_SELECTED.text).toBe(
      'Select a step or a connection on the canvas to change its settings. Every setting comes with a plain-language explanation.'
    );
    expect(NOTHING_SELECTED.stepsTitle).toBe('How a workflow runs');
    expect(NOTHING_SELECTED.steps).toEqual([
      ['It begins at ', { strong: 'Start' }, ' and runs one step at a time.'],
      ['When a step finishes, a ', { strong: 'connection' }, ' decides what runs next. Rules on connections can look at how the step went.'],
      ['Steps can ask a person, call an AI model, or run a tool. Results are saved so later steps can use them.'],
      ['It ends when it reaches a ', { strong: 'Finish' }, ' step.'],
    ]);
  });
});

describe('branchRuleField', () => {
  it('labels the rule with the target step and edits the edge condition', () => {
    expect(branchRuleField({ target: 'Pick a favourite', label: '', loop: false })).toEqual({
      attr: 'condition',
      label: 'Go to “Pick a favourite” when…',
      control: 'text',
      placeholder: 'e.g. outcome=success',
      help: 'Leave blank to use the label as the rule.',
      tryChips: ['outcome=success', 'outcome=fail'],
    });
  });

  it('mentions the connection label and the loop in the help', () => {
    expect(branchRuleField({ target: 'Draft three concepts', label: 'No, try again', loop: true }).help).toBe(
      'Connection label: No, try again. This path loops back and redoes the step. Leave blank to use the label as the rule.'
    );
    expect(branchRuleField({ target: 'Pick a favourite', label: 'Yes, continue', loop: false }).help).toBe(
      'Connection label: Yes, continue. Leave blank to use the label as the rule.'
    );
  });
});

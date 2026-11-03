// ABOUTME: Plain-language field catalogue for every step kind the editor can show
// ABOUTME: Palette, inspector and Step guide all read labels, help and chips from here

import type { AboutSection } from './stepKinds';

/** One choice in a radio-group field, e.g. a built-in tool. */
export interface ChoiceOption {
  value: string;
  title: string;
  desc: string;
}

/** A titled row in a field's "More about …" card. */
export interface MoreRow {
  title: string;
  text: string;
}

export interface FieldSpec {
  /** DOT attribute, e.g. 'tool_command'. 'label' is the step name. */
  attr: string;
  label: string;
  help: string;
  placeholder?: string;
  control: 'text' | 'textarea' | 'code' | 'choice' | 'switch' | 'model';
  /** Visible rows for textarea and code controls. */
  rows?: number;
  required?: boolean;
  more?: MoreRow[];
  tryChips?: string[];
  /** Lives under More settings. */
  advanced?: boolean;
  /** For choice controls. */
  options?: ChoiceOption[];
  /** Not a DOT attribute: the form works the value out from other attrs and never writes it. */
  derived?: boolean;
}

// Copy is Main.dc.html nodeDefs word for word, except the board's "New" badges (D12) and the
// Model field, which keeps ModelPicker instead of free text and chips (D2).

export const TOOL_MODES: ChoiceOption[] = [
  { value: 'builtin', title: 'Built-in tool', desc: 'A ready-made check or capture from Smasher.' },
  { value: 'command', title: 'Shell command', desc: 'Any command on your computer.' },
];

export const BUILT_IN_TOOLS: ChoiceOption[] = [
  { value: 'render_capture', title: 'Screenshot a design', desc: 'Renders a candidate in a headless browser and saves screenshots and a manifest.' },
  { value: 'system_lint', title: 'Design-system check', desc: 'Checks a candidate against the design system’s rules. No AI involved.' },
  { value: 'task_critic', title: 'Usability critique', desc: 'One AI call that reviews a candidate the way a persona-based usability critic would.' },
  { value: 'synthesis', title: 'Summarise critiques', desc: 'One AI call that merges earlier critiques into a single set of recommendations.' },
];

export const ANSWER_MODES: ChoiceOption[] = [
  { value: 'freeform', title: 'Free text', desc: 'Type anything, or choose from a gallery of candidates.' },
  { value: 'approve', title: 'Yes or no', desc: 'A simple approval.' },
  { value: 'options', title: 'Pick from a list', desc: 'Choose one of the options you write.' },
];

/** The note shown in place of settings for kinds that have few or none. */
export const KIND_NOTES: Record<string, string> = {
  FanIn: 'This step has no settings. It waits for the paths started by a Split. If several of them save the same value, the last one to finish wins.',
  Start: 'This step has no settings beyond its name.',
  Exit: 'This step has no settings beyond its name.',
  Conditional:
    'A branch has no rule of its own. Each path leaving it carries a rule, and the workflow follows the first path whose rule is true (the highest priority wins a tie). Edit those rules here, or select a connection on the canvas.',
};

const NAME_HELP: Record<string, string> = {
  Codergen: 'Shown on the canvas and in run logs. If Instructions is empty, this name is used as the instruction.',
  Manager: 'Shown on the canvas and in run logs. If Task is empty, this name is used as the task.',
  Interviewer: 'Shown on the canvas and in run logs. If Question is empty, this name is used as the question.',
};

function stepName(handler: string): FieldSpec {
  return { attr: 'label', label: 'Step name', control: 'text', help: NAME_HELP[handler] ?? 'Shown on the canvas and in run logs.' };
}

const MODEL: FieldSpec = {
  attr: 'model',
  label: 'Model',
  control: 'model',
  help: 'Which AI model does this step’s work. Leave blank to use the workflow’s default.',
  more: [
    { title: 'If left blank', text: 'Uses the model chosen for the whole run (claude-sonnet-5 unless the run says otherwise).' },
    { title: 'Good to know', text: 'Larger models are usually slower and cost more, so save them for the hard steps. A workflow stylesheet can also set the model for many steps at once.' },
  ],
};

const NOT_VALID_JSON: MoreRow = { title: 'If it is not valid JSON', text: 'The step fails when it runs. The app flags it here first.' };

const KIND_FIELDS: Record<string, FieldSpec[]> = {
  Codergen: [
    {
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
    },
    MODEL,
  ],
  Manager: [
    {
      attr: 'task',
      label: 'Task',
      control: 'text',
      help: 'What should the coordinator work out? Write it in plain language. It is sent to the AI as-is.',
      placeholder: 'e.g. coordinate-review',
      tryChips: ['coordinate-review', 'delegate-subtask', 'aggregate-results', 'escalate-to-human'],
      more: [
        { title: 'If left blank', text: 'The step name is used. If both are empty the run fails with “no task specified”.' },
        { title: 'Good to know', text: 'The suggestions are starting points, not a fixed list. This step talks to an AI. To get a person’s decision, use an Ask a person step.' },
      ],
    },
    {
      attr: 'config',
      label: 'Settings (JSON)',
      control: 'code',
      rows: 4,
      placeholder: '{ }',
      help: 'Optional extra settings for the coordinator, written as JSON. Leave blank for none.',
      more: [{ title: 'If left blank', text: 'Treated as empty settings: {}.' }, NOT_VALID_JSON],
    },
    MODEL,
  ],
  Tool: [
    {
      attr: 'tool_mode',
      label: 'What should this step run?',
      control: 'choice',
      derived: true,
      help: 'Choose one. A step cannot do both.',
      options: TOOL_MODES,
    },
    {
      attr: 'tool',
      label: 'Tool',
      control: 'choice',
      required: true,
      help: 'Pick the built-in tool to run.',
      options: BUILT_IN_TOOLS,
      more: [{ title: 'If none is chosen', text: 'The step fails, because it needs either a tool or a command.' }],
    },
    {
      attr: 'args',
      label: 'Tool settings (JSON)',
      control: 'code',
      rows: 4,
      placeholder: '{ }',
      help: 'Optional settings for the tool, written as JSON.',
      more: [
        { title: 'Example', text: '{"candidate_dir": "candidates/a"}' },
        { title: 'If left blank', text: 'The tool runs with its default settings: {}.' },
        NOT_VALID_JSON,
      ],
    },
    MODEL,
    {
      attr: 'tool_command',
      label: 'Command',
      control: 'code',
      required: true,
      rows: 4,
      placeholder: 'e.g. npm test',
      help: 'The command to run, from the run’s working folder. It succeeds only if it finishes with exit code 0.',
      more: [
        { title: 'Example', text: 'npm test' },
        { title: 'What you can use afterwards', text: 'Later steps and rules can read what it printed (tool.output), its errors (tool.stderr) and its exit code (tool.exit_code).' },
        { title: 'Good to know', text: 'Anything that looks like a secret (names containing API_KEY, TOKEN, PASSWORD or SECRET) is hidden from the command. If you start a background process, redirect its output (server > server.log 2>&1 &) or the step will wait for it.' },
      ],
    },
    {
      attr: 'timeout',
      label: 'Time limit',
      control: 'text',
      placeholder: '600',
      help: 'How long the command may run before it is stopped.',
      more: [
        { title: 'Examples', text: '600 (seconds), 30s, 5m' },
        { title: 'If left blank', text: '10 minutes (600 seconds).' },
        { title: 'If it runs out', text: 'The command is stopped and the step fails with “timed out”.' },
      ],
    },
  ],
  Interviewer: [
    {
      attr: 'question',
      label: 'Question',
      control: 'textarea',
      rows: 3,
      help: 'What you want to ask. Shown to the person in the app while the run is paused.',
      placeholder: 'e.g. Which concept should we take forward?',
      more: [{ title: 'If left blank', text: 'The step name is used as the question.' }],
    },
    {
      attr: 'answer_mode',
      label: 'How should they answer?',
      control: 'choice',
      derived: true,
      help: 'Choose the kind of answer you need back.',
      options: ANSWER_MODES,
    },
    {
      attr: 'options',
      label: 'Options',
      control: 'text',
      required: true,
      placeholder: 'approve, revise, reject',
      help: 'Separate the choices with commas.',
      more: [{ title: 'Example', text: 'approve, revise, reject' }],
    },
    {
      attr: 'gallery',
      label: 'Show a gallery of candidates',
      control: 'switch',
      help: 'Lets the person look through generated designs, choose favourites and add comments. Only works with free text answers.',
      more: [
        { title: 'What gets saved', text: 'A structured answer: which candidates were selected, the decision and any comments.' },
        { title: 'Good to know', text: 'Switching to Yes or no, or to a list, turns the gallery off because those modes never reach it.' },
      ],
    },
    {
      attr: 'candidate_count',
      label: 'Candidates to expect',
      control: 'text',
      placeholder: '3',
      help: 'How many candidates the gallery should expect to show.',
      more: [
        { title: 'Examples', text: '3, or phase_default(discover)' },
        { title: 'Good to know', text: 'Only used for the gallery display and its warnings. It does not limit how many candidates the run makes.' },
      ],
    },
    {
      attr: 'human.timeout_secs',
      label: 'Stop waiting after (seconds)',
      control: 'text',
      advanced: true,
      placeholder: 'e.g. 3600',
      help: 'If nobody answers in time, the step carries on with the fallback answer below. Free text answers only.',
    },
    {
      attr: 'human.default_choice',
      label: 'Fallback answer',
      control: 'text',
      advanced: true,
      placeholder: 'e.g. approve',
      help: 'The answer to use when the wait runs out.',
    },
  ],
  SubPipeline: [
    {
      attr: 'pipeline',
      label: 'Workflow file',
      control: 'text',
      required: true,
      placeholder: 'examples/sub_flow.dot',
      help: 'The path to the workflow (.dot file) to run as part of this one.',
      more: [
        { title: 'Where it looks', text: 'Relative to the folder this workflow lives in.' },
        { title: 'If left blank', text: 'The workflow cannot be assembled and you will see a “missing pipeline” error.' },
      ],
    },
  ],
  Parallel: [
    {
      attr: 'max_concurrency',
      label: 'At most at once',
      control: 'text',
      placeholder: '10',
      help: 'Limits how many paths run at the same time.',
      more: [{ title: 'If left blank', text: 'Up to 10 paths at once.' }],
    },
    {
      attr: 'fail_fast',
      label: 'Stop everything if one fails',
      control: 'switch',
      help: 'When on, the remaining paths are cancelled as soon as any path fails.',
      more: [{ title: 'If off', text: 'Every path finishes, even if some fail. This is the default.' }],
    },
  ],
  FanIn: [],
  Conditional: [],
  Start: [],
  Exit: [],
};

// The engine's retry policy (retry.rs). Retries writes max_retries only; a `retries` attr is left alone.
function retryFields(handler: string): FieldSpec[] {
  const retriesMore: MoreRow[] = [
    { title: 'Total attempts', text: 'Retries plus the first attempt. Two retries means up to three attempts.' },
    { title: 'Not the same as “Go back and redo”', text: 'Retries re-run a step after a failure. A loop is drawn on the canvas with a connection set to Go back and redo.' },
  ];
  if (handler === 'Tool') retriesMore.push({ title: 'Commands', text: 'A shell command that fails is not retried automatically.' });
  return [
    { attr: 'max_retries', label: 'Retries', control: 'text', advanced: true, placeholder: '0', help: 'How many extra attempts to make if the step fails.', more: retriesMore },
    { attr: 'retry_delay', label: 'Wait between attempts', control: 'text', advanced: true, placeholder: '1s', help: 'The starting pause before the next attempt, for example 500ms or 1s. It grows after each failed attempt.' },
    { attr: 'max_retry_delay', label: 'Longest wait', control: 'text', advanced: true, placeholder: '30s', help: 'Caps how long the pause can grow.' },
    { attr: 'retry_jitter', label: 'Randomise the wait', control: 'switch', advanced: true, help: 'Adds a little randomness so lots of retries do not all fire at the same moment.' },
  ];
}

const NO_RETRIES = new Set(['Start', 'Exit', 'Conditional']);

/** Every field a step of this kind shows, in board order: Step name, the kind's own, then More settings. */
export function stepFields(handler: string): FieldSpec[] {
  const own = KIND_FIELDS[handler];
  if (!own) return [stepName(handler)];
  return [stepName(handler), ...own, ...(NO_RETRIES.has(handler) ? [] : retryFields(handler))];
}

// Connections: Main.dc.html edgeFields, SYNTAX and the inspector's connection and empty states.

const CONDITION_CHIPS = ['outcome=success', 'outcome=fail'];

export const CONNECTION_FIELDS: FieldSpec[] = [
  {
    attr: 'label',
    label: 'Label',
    control: 'text',
    placeholder: 'e.g. Yes, continue',
    help: 'The name shown on the connection. Labels like success, yes or true also tell the workflow this path is for a good result; failure, error, no or false for a bad one.',
  },
  {
    attr: 'condition',
    label: 'Take this path when…',
    control: 'text',
    placeholder: 'e.g. outcome=success',
    help: 'A rule that must be true for the workflow to follow this connection. If left blank, the label is used.',
    tryChips: CONDITION_CHIPS,
    more: [
      { title: 'Examples', text: 'outcome=success · status!=ready · count>10 · auth=valid && quota=ok' },
      { title: 'Reading saved values', text: 'Use the name of any saved value, such as tool.output. A value that was never saved makes the rule false.' },
      { title: 'Need the full syntax?', text: 'Open “Rule syntax” below.' },
    ],
  },
  {
    attr: 'priority',
    label: 'Priority',
    control: 'text',
    placeholder: '0',
    help: 'If more than one connection’s rule is true, the highest number wins. Whole numbers only. The default is 0.',
  },
  {
    attr: 'loop_restart',
    label: 'Go back and redo',
    control: 'switch',
    help: 'When on, following this connection clears the target step’s saved results and runs it again from scratch. Use it for “try again” loops.',
    more: [
      { title: 'Not the same as retries', text: 'Retries re-run a step after a failure. This is a deliberate loop you draw on the canvas.' },
      { title: 'Safety stop', text: 'A run stops after 1000 step visits, so a loop can never run forever.' },
    ],
  },
];

/** The About this connection tab. */
export const CONNECTION_ABOUT: AboutSection[] = [
  ['What it does', 'A connection decides what runs next. When a step finishes, the workflow follows the connection whose rule matches.'],
  ['Rules', 'A rule can look at how the previous step went (outcome) or at any saved value. With no rule, the connection is always allowed.'],
  ['Labels', 'Labels success, yes or true match a good result. Labels failure, error, no or false match a bad one.'],
  ['When more than one matches', 'The connection with the highest priority wins. The default priority is 0.'],
  ['Loops', 'Turn on Go back and redo to run the target step again from scratch. Loops are drawn dashed on the canvas.'],
];

/** '' when the priority is blank or a whole number, otherwise the message to show under the field. */
export function priorityError(value: string): string {
  return value === '' || /^-?\d+$/.test(value) ? '' : 'Priority must be a whole number, like 1 or 5.';
}

/** Text with inline code or bold runs, e.g. ['It begins at ', { strong: 'Start' }, '.']. */
export type RichText = (string | { code: string } | { strong: string })[];

export const RULE_SYNTAX: { title: string; rows: { code: string; text: string }[]; footer: RichText } = {
  title: 'Rule syntax',
  rows: [
    { code: 'status=ready', text: 'equals' },
    { code: 'status!=ready', text: 'does not equal' },
    { code: 'count>10', text: 'greater than (numbers)' },
    { code: 'count<10', text: 'less than (numbers)' },
    { code: 'a=1 && b=2', text: 'both must be true' },
    { code: 'a=1 || b=2', text: 'either can be true' },
    { code: '!a=1', text: 'not' },
    { code: '(a=1 || b=2) && c=3', text: 'group with brackets' },
  ],
  footer: [
    'After every step, ', { code: 'outcome' }, ' is ', { code: 'success' }, ', ', { code: 'fail' }, ', ',
    { code: 'retry' }, ' or ', { code: 'skip' }, '. A value that was never saved makes a rule false.',
  ],
};

/** The inspector when nothing is selected. */
export const NOTHING_SELECTED: { heading: string; text: string; stepsTitle: string; steps: RichText[] } = {
  heading: 'Nothing selected',
  text: 'Select a step or a connection on the canvas to change its settings. Every setting comes with a plain-language explanation.',
  stepsTitle: 'How a workflow runs',
  steps: [
    ['It begins at ', { strong: 'Start' }, ' and runs one step at a time.'],
    ['When a step finishes, a ', { strong: 'connection' }, ' decides what runs next. Rules on connections can look at how the step went.'],
    ['Steps can ask a person, call an AI model, or run a tool. Results are saved so later steps can use them.'],
    ['It ends when it reaches a ', { strong: 'Finish' }, ' step.'],
  ],
};

/** A Branch's rule field for one outgoing connection; it edits that edge's condition. */
export function branchRuleField(edge: { target: string; label: string; loop: boolean }): FieldSpec {
  const help =
    (edge.label ? `Connection label: ${edge.label}. ` : '') +
    (edge.loop ? 'This path loops back and redoes the step. ' : '') +
    'Leave blank to use the label as the rule.';
  return {
    attr: 'condition',
    label: `Go to “${edge.target}” when…`,
    control: 'text',
    placeholder: 'e.g. outcome=success',
    help,
    tryChips: CONDITION_CHIPS,
  };
}

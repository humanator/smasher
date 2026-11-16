<script lang="ts">
  // ABOUTME: Interviewer (Ask a person) node-kind side-panel form component
  // ABOUTME: Edits Question, the answer mode (approve/options), Options, the gallery and Candidates to expect

  import { untrack } from 'svelte';
  import { answerMode as answerModeOf } from '$lib/nodeSummary';
  import { stepFields, type FieldSpec } from '$lib/stepFields';
  import { fieldProblem } from '$lib/workflowProblems';
  import Field from '../inspector/Field.svelte';
  import type { NodeFormProps } from '../types';

  // Grounded in interviewer.rs:690-784 (InterviewerHandler::execute) --
  // NOT the spec's illustrative "gallery+candidate_count on an Interviewer"
  // example taken at face value:
  // - `question`: the handler's real fallback chain is
  //   question -> prompt -> label, but that's a *read-time* concern the
  //   handler itself already implements; this form's job is letting a
  //   human *write* the question, so it only ever writes `question`
  //   (leaving `prompt`/`label` alone -- `label` is edited via the shared
  //   side-panel field, common to every node kind).
  // - `gallery` (Bool `true`) selects gallery-gate mode -- a structured
  //   `{selected, decision, comments}` answer, but only reinterpreted in
  //   the handler's free-form branch (reached only when neither `approve`
  //   nor `options` is set: approve is checked first, then options, then
  //   free-form/gallery). Enabling gallery mode while Yes/No or Options is
  //   selected would write an attr the handler's own branch order would
  //   silently never reach -- worse than not offering it -- so this form
  //   only offers the gallery switch for Free text, and choosing another
  //   answer while gallery is on turns it back off.
  // - `candidate_count`: confirmed absent from interviewer.rs itself by
  //   grep (matching the plan's own grounding note) -- but genuinely read
  //   by smasher-web's routes/gallery.rs (`resolve_candidate_count`),
  //   which drives the gallery dashboard card's expected-candidate display
  //   (a display/warning hint, never enforced). Real and worth wiring for
  //   gallery-mode gates; kept as a free-text field since the real reader
  //   accepts either an integer literal or `phase_default(<phase>)`.
  // - `approve` (Bool `true` exactly, not the string "true") for yes/no
  //   mode; `options` (comma-separated string) for a fixed-choice list.
  //
  // The mode is nodeSummary's answerMode: a list whenever `options` exists,
  // even empty, so the step card, the "needs a list of options" problem and
  // this form always agree. Choosing Pick from a list therefore writes an
  // empty `options`, and clearing the list keeps it empty rather than
  // deleting it (ToolForm's `tool_command` works the same way).
  let { attrs, onChange, problems = [] }: NodeFormProps = $props();

  const fields = stepFields('Interviewer');
  const spec = (attr: string): FieldSpec => fields.find((f) => f.attr === attr)!;

  function attrText(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  // Seeded once per mount -- the canvas remounts this component via {#key}
  // on every selection change, so "captures the initial value only" is
  // intended, not a bug (see CodergenForm's identical note).
  const initial = untrack(() => {
    const mode = answerModeOf(attrs);
    return {
      question: attrText(attrs.question),
      mode,
      gallery: (attrs.gallery === true || attrs.gallery === 'true') && mode === 'freeform',
      candidateCount: attrText(attrs.candidate_count),
      optionsText: attrText(attrs.options),
    };
  });

  let question = $state(initial.question);
  let answerMode = $state<string>(initial.mode);
  let gallery = $state(initial.gallery);
  let candidateCount = $state(initial.candidateCount);
  let optionsText = $state(initial.optionsText);

  function handleGalleryToggle(checked: boolean) {
    onChange({
      attrs: {
        gallery: checked || undefined,
        candidate_count: checked ? candidateCount || undefined : undefined,
      },
    });
  }

  function handleAnswerModeChange(next: string) {
    gallery = false;
    onChange({
      attrs: {
        approve: next === 'approve' ? true : undefined,
        options: next === 'options' ? optionsText : undefined,
        gallery: undefined,
        candidate_count: undefined,
      },
    });
  }
</script>

<div class="flex flex-col gap-5" data-testid="interviewer-form">
  <Field
    spec={spec('question')}
    bind:value={question}
    testId="interviewer-question"
    oninput={(v) => onChange({ attrs: { question: v || undefined } })}
  />
  <Field spec={spec('answer_mode')} bind:value={answerMode} testId="interviewer-answer-mode" oninput={handleAnswerModeChange} />

  {#if answerMode === 'options'}
    <Field
      spec={spec('options')}
      bind:value={optionsText}
      testId="interviewer-options"
      error={fieldProblem('Interviewer', 'options', problems)}
      oninput={(v) => onChange({ attrs: { options: v } })}
    />
  {:else if answerMode === 'freeform'}
    <Field
      spec={spec('gallery')}
      bind:checked={gallery}
      testId="interviewer-gallery-toggle"
      onCheckedChange={handleGalleryToggle}
    />
    {#if gallery}
      <Field
        spec={spec('candidate_count')}
        bind:value={candidateCount}
        testId="interviewer-candidate-count"
        oninput={(v) => onChange({ attrs: { candidate_count: v || undefined } })}
      />
    {/if}
  {/if}
</div>

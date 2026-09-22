<script lang="ts">
  // ABOUTME: Interviewer node-kind side-panel form component
  // ABOUTME: Edits question/gallery/approve/options/candidate_count attributes

  import { untrack } from 'svelte';
  import './nodeForms.css';
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
  //   only allows the gallery toggle when Answer mode is Free-form, and
  //   switching away from Free-form while gallery is on turns it back off.
  // - `candidate_count`: confirmed absent from interviewer.rs itself by
  //   grep (matching the plan's own grounding note) -- but genuinely read
  //   by smasher-web's routes/gallery.rs (`resolve_candidate_count`),
  //   which drives the gallery dashboard card's expected-candidate display
  //   (a display/warning hint, never enforced). Real and worth wiring for
  //   gallery-mode gates; kept as a free-text field since the real reader
  //   accepts either an integer literal or `phase_default(<phase>)`.
  // - `approve` (Bool `true` exactly, not the string "true") for yes/no
  //   mode; `options` (comma-separated string) for a fixed-choice list.
  let { attrs, onChange }: NodeFormProps = $props();

  type AnswerMode = 'freeform' | 'approve' | 'options';

  function computeAnswerMode(a: Record<string, unknown>): AnswerMode {
    if (a.approve === true) return 'approve';
    if (typeof a.options === 'string') return 'options';
    return 'freeform';
  }

  function computeGallery(a: Record<string, unknown>): boolean {
    return a.gallery === true || a.gallery === 'true';
  }

  // Seeded once per mount -- WorkflowCanvasInner remounts this component
  // via {#key node.id} on every selection change, so "captures the initial
  // value only" is intended, not a bug (see CodergenForm's identical note).
  const initial = untrack(() => {
    const answerMode = computeAnswerMode(attrs);
    return {
      question: typeof attrs.question === 'string' ? attrs.question : '',
      answerMode,
      gallery: computeGallery(attrs) && answerMode === 'freeform',
      candidateCount:
        typeof attrs.candidate_count === 'string'
          ? attrs.candidate_count
          : typeof attrs.candidate_count === 'number'
            ? String(attrs.candidate_count)
            : '',
      optionsText: typeof attrs.options === 'string' ? attrs.options : '',
    };
  });

  let question = $state(initial.question);
  let answerMode = $state<AnswerMode>(initial.answerMode);
  let gallery = $state(initial.gallery);
  let candidateCount = $state(initial.candidateCount);
  let optionsText = $state(initial.optionsText);

  function handleQuestionInput(event: Event) {
    question = (event.target as HTMLTextAreaElement).value;
    onChange({ attrs: { question: question || undefined } });
  }

  function handleGalleryToggle(event: Event) {
    gallery = (event.target as HTMLInputElement).checked;
    onChange({
      attrs: {
        gallery: gallery || undefined,
        candidate_count: gallery ? candidateCount || undefined : undefined,
      },
    });
  }

  function handleCandidateCountInput(event: Event) {
    candidateCount = (event.target as HTMLInputElement).value;
    onChange({ attrs: { candidate_count: candidateCount || undefined } });
  }

  function handleAnswerModeChange(event: Event) {
    answerMode = (event.target as HTMLSelectElement).value as AnswerMode;
    if (answerMode !== 'freeform' && gallery) {
      gallery = false;
    }
    onChange({
      attrs: {
        approve: answerMode === 'approve' ? true : undefined,
        options: answerMode === 'options' ? optionsText || undefined : undefined,
        gallery: answerMode === 'freeform' && gallery ? true : undefined,
        candidate_count: answerMode === 'freeform' && gallery ? candidateCount || undefined : undefined,
      },
    });
  }

  function handleOptionsInput(event: Event) {
    optionsText = (event.target as HTMLInputElement).value;
    onChange({ attrs: { options: optionsText || undefined } });
  }
</script>

<div class="node-form" data-testid="interviewer-form">
  <label class="node-form-field">
    Question
    <textarea data-testid="interviewer-question" rows="3" value={question} oninput={handleQuestionInput}></textarea>
  </label>

  <label class="node-form-field node-form-field-inline">
    <input
      type="checkbox"
      data-testid="interviewer-gallery-toggle"
      checked={gallery}
      disabled={answerMode !== 'freeform'}
      onchange={handleGalleryToggle}
    />
    Gallery gate
  </label>

  {#if gallery}
    <label class="node-form-field">
      Candidate count
      <input
        type="text"
        data-testid="interviewer-candidate-count"
        value={candidateCount}
        oninput={handleCandidateCountInput}
        placeholder="e.g. 3 or phase_default(discover)"
      />
      <span class="node-form-hint">Read by the gallery dashboard card only, not the interviewer step itself.</span>
    </label>
  {/if}

  <label class="node-form-field">
    Answer mode
    <select data-testid="interviewer-answer-mode" value={answerMode} disabled={gallery} onchange={handleAnswerModeChange}>
      <option value="freeform">Free-form</option>
      <option value="approve">Yes / No</option>
      <option value="options">Options list</option>
    </select>
  </label>

  {#if answerMode === 'options'}
    <label class="node-form-field">
      Options (comma-separated)
      <input
        type="text"
        data-testid="interviewer-options"
        value={optionsText}
        oninput={handleOptionsInput}
        placeholder="e.g. approve, revise, reject"
      />
    </label>
  {/if}
</div>

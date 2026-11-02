// ABOUTME: Maps a failed run's error string to the "What you can try" suggestions on the run page
// ABOUTME: A small table of known engine failure wordings; unmatched errors get only the generic advice

export const GENERIC_ADVICE = "Open the workflow in the editor and check this step's settings.";

// Each pattern matches wording the engine really produces (tool_handler.rs, the
// system-lint and render-capture backends, smasher-llm's error enum). Advice
// only restates what the matched wording says; it never names a cause beyond it.
const PATTERNS: { test: RegExp; advice: string[] }[] = [
  {
    test: /missing candidate_dir/i,
    advice: [
      'This step needs a candidate_dir, the folder of the candidate to check. Make sure a step before it produces one.',
    ],
  },
  {
    test: /\bexit code -?\d+/i,
    advice: [
      "The step's command stopped with an error. Run the same command yourself and check its output.",
    ],
  },
  {
    test: /timed out/i,
    advice: [
      'The step took longer than its time limit. Try again, or raise its time limit in the editor.',
    ],
  },
  {
    test: /missing api key|authentication failed|is not configured/i,
    advice: ['Check that an API key is set for this step\'s provider in Settings.'],
  },
  {
    test: /rate limited|server error|not found or not available|quota exceeded|access denied by|network error|context length exceeded/i,
    advice: ["Try again in a moment, or pick a different model for this step in the editor."],
  },
];

/** Suggestions for an error, each once; just the generic advice when nothing matches. */
export function failureAdvice(error: string | null): string[] {
  const text = error?.trim() ?? '';
  const advice = new Set<string>();
  for (const pattern of PATTERNS) {
    if (pattern.test.test(text)) pattern.advice.forEach((a) => advice.add(a));
  }
  return advice.size > 0 ? [...advice] : [GENERIC_ADVICE];
}

// ABOUTME: Turns the run dialog's four text fields into a POST /api/workflows/{id}/run body
// ABOUTME: Does the parsing the old HTMX handler did server-side, plus per-field validation

import type { RunWorkflowRequest } from './api/runs';

export interface RunFormValues {
  model: string;
  variables: string;
  brief: string;
  nodeOverrides: string;
}

export type RunFormErrors = Partial<Record<'variables' | 'nodeOverrides', string>>;

export type RunRequestResult =
  | { ok: true; request: RunWorkflowRequest }
  | { ok: false; errors: RunFormErrors };

const SHAPE_ERROR = 'Expected {"node_id": {"model": "...", "provider": "..."}}';

export function buildRunRequest(values: RunFormValues): RunRequestResult {
  const errors: RunFormErrors = {};
  const variables = parseVariables(values.variables, errors);
  const nodeOverrides = parseNodeOverrides(values.nodeOverrides, errors);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const brief = values.brief.trim();
  if (brief) variables.brief = brief; // wins over a brief= line, as the old form did

  const request: RunWorkflowRequest = { variables };
  const model = values.model.trim();
  if (model) request.model = model; // "" would replace the server default, not fall back to it
  if (nodeOverrides) request.node_overrides = nodeOverrides;
  return { ok: true, request };
}

// One key=value per line, split at the first = so values may contain one.
function parseVariables(text: string, errors: RunFormErrors): Record<string, string> {
  const variables: Record<string, string> = {};
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const eq = line.indexOf('=');
    const key = eq === -1 ? '' : line.slice(0, eq).trim();
    if (!key) {
      errors.variables = `Line ${i + 1}: expected key=value`;
      break;
    }
    variables[key] = line.slice(eq + 1).trim();
  }
  return variables;
}

// The server wants { node_id: { model?: string, provider?: string } } and answers any
// other shape with a plain-text 422, so the shape is checked here instead.
function parseNodeOverrides(
  text: string,
  errors: RunFormErrors
): Record<string, unknown> | undefined {
  if (!text.trim()) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    errors.nodeOverrides = `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
    return undefined;
  }
  if (!isPlainObject(parsed) || !Object.values(parsed).every(isNodeOverride)) {
    errors.nodeOverrides = SHAPE_ERROR;
    return undefined;
  }
  return parsed;
}

function isNodeOverride(value: unknown): boolean {
  return (
    isPlainObject(value) &&
    ['model', 'provider'].every((k) => value[k] === undefined || typeof value[k] === 'string')
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ABOUTME: Tests for buildRunRequest, which turns the run dialog's fields into a request body
// ABOUTME: Pure function tests: parsing, trimming, brief precedence, and per-field validation errors

import { describe, it, expect } from 'vitest';
import { buildRunRequest, type RunFormValues } from '../../src/lib/runRequest';

const SHAPE_ERROR = 'Expected {"node_id": {"model": "...", "provider": "..."}}';

function values(overrides: Partial<RunFormValues> = {}): RunFormValues {
  return { model: '', variables: '', brief: '', nodeOverrides: '', ...overrides };
}

function request(overrides: Partial<RunFormValues>) {
  const result = buildRunRequest(values(overrides));
  if (!result.ok) throw new Error(`expected ok, got ${JSON.stringify(result.errors)}`);
  return result.request;
}

function errors(overrides: Partial<RunFormValues>) {
  const result = buildRunRequest(values(overrides));
  if (result.ok) throw new Error(`expected errors, got ${JSON.stringify(result.request)}`);
  return result.errors;
}

describe('buildRunRequest', () => {
  it('sends only empty variables when every field is blank', () => {
    const req = request({});
    expect(req).toEqual({ variables: {} });
    expect('model' in req).toBe(false);
    expect('node_overrides' in req).toBe(false);
  });

  describe('model', () => {
    it('is trimmed', () => {
      expect(request({ model: '  m-1  ' }).model).toBe('m-1');
    });

    it('is left out when whitespace-only, so the server default applies', () => {
      expect('model' in request({ model: '   ' })).toBe(false);
    });
  });

  describe('variables', () => {
    it('parses several lines, skipping blank ones and trimming keys and values', () => {
      expect(request({ variables: ' colour = blue \n\n   \nsize=10\n' }).variables).toEqual({
        colour: 'blue',
        size: '10',
      });
    });

    it('splits at the first = so values may contain =', () => {
      expect(request({ variables: 'a=b=c' }).variables).toEqual({ a: 'b=c' });
    });

    it('lets a later duplicate key win', () => {
      expect(request({ variables: 'a=1\na=2' }).variables).toEqual({ a: '2' });
    });

    it('allows an empty value', () => {
      expect(request({ variables: 'a=' }).variables).toEqual({ a: '' });
    });

    it('rejects a line without = with its 1-based line number', () => {
      expect(errors({ variables: 'a=1\ncolour blue' })).toEqual({
        variables: 'Line 2: expected key=value',
      });
    });

    it('rejects a line with an empty key', () => {
      expect(errors({ variables: '\n\n  =x' })).toEqual({
        variables: 'Line 3: expected key=value',
      });
    });
  });

  describe('brief', () => {
    it('is trimmed and sent as variables.brief', () => {
      expect(request({ brief: '  hello  ' }).variables).toEqual({ brief: 'hello' });
    });

    it('beats a brief= line in variables', () => {
      expect(request({ variables: 'brief=old\nx=1', brief: 'new' }).variables).toEqual({
        brief: 'new',
        x: '1',
      });
    });

    it('leaves a brief= line alone when whitespace-only', () => {
      expect(request({ variables: 'brief=old', brief: '  \n ' }).variables).toEqual({
        brief: 'old',
      });
    });
  });

  describe('node overrides', () => {
    it('is left out when blank', () => {
      expect('node_overrides' in request({ nodeOverrides: '  \n ' })).toBe(false);
    });

    it('passes a valid object through', () => {
      const overrides = { plan: { model: 'm-2', provider: 'openai' }, review: {} };
      expect(request({ nodeOverrides: JSON.stringify(overrides) }).node_overrides).toEqual(
        overrides
      );
    });

    it('reports invalid JSON with the parser message', () => {
      expect(errors({ nodeOverrides: '{nope' }).nodeOverrides).toMatch(/^Invalid JSON: .+/);
    });

    it.each(['[]', '"x"', 'null', '{"a": "m"}', '{"a": {"model": 1}}', '{"a": {"provider": false}}'])(
      'rejects the wrong shape %s',
      (input) => {
        expect(errors({ nodeOverrides: input })).toEqual({ nodeOverrides: SHAPE_ERROR });
      }
    );
  });

  it('returns both errors when both fields are bad', () => {
    expect(errors({ variables: 'oops', nodeOverrides: '[]' })).toEqual({
      variables: 'Line 1: expected key=value',
      nodeOverrides: SHAPE_ERROR,
    });
  });
});

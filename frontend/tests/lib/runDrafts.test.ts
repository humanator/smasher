// ABOUTME: Tests for runDrafts, the run dialog's in-memory per-workflow form values
// ABOUTME: Covers the empty default, copy-on-save, and isolation between workflow ids

import { describe, it, expect } from 'vitest';
import { getDraft, saveDraft } from '../../src/lib/runDrafts';

describe('runDrafts', () => {
  it('gives four empty strings for a workflow it has not seen', () => {
    expect(getDraft('never-seen')).toEqual({
      model: '',
      variables: '',
      brief: '',
      nodeOverrides: '',
    });
  });

  it('returns a saved draft as a copy', () => {
    const values = { model: 'm-1', variables: 'a=1', brief: 'hi', nodeOverrides: '{}' };
    saveDraft('wf-copy', values);
    values.brief = 'changed after save';

    const draft = getDraft('wf-copy');
    expect(draft).toEqual({ model: 'm-1', variables: 'a=1', brief: 'hi', nodeOverrides: '{}' });

    draft.model = 'changed after get';
    expect(getDraft('wf-copy').model).toBe('m-1');
  });

  it('keeps each workflow separate', () => {
    saveDraft('wf-a', { model: 'a', variables: '', brief: '', nodeOverrides: '' });
    saveDraft('wf-b', { model: 'b', variables: '', brief: '', nodeOverrides: '' });
    expect(getDraft('wf-a').model).toBe('a');
    expect(getDraft('wf-b').model).toBe('b');
  });
});

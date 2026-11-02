// ABOUTME: Tests for decisionEdges, which turns a gallery gate's outgoing edges into the Decision bar's buttons
// ABOUTME: Uses the edge names of the repo's own workflows (proceed, iterate) beside the two the bar knows

import { describe, it, expect } from 'vitest';
import { decisionLabel, gateButtons, isApproveDecision } from '../../src/lib/decisionEdges';

describe('gateButtons', () => {
  it('maps iterate and approve to their named buttons, with the approve edge needing a selection', () => {
    expect(gateButtons(['iterate', 'approve'])).toEqual([
      { edge: 'iterate', kind: 'iterate', label: 'Try Again with My Notes' },
      { edge: 'approve', kind: 'approve', label: 'Approve Selected' },
    ]);
  });

  it('puts the approve button last whatever order the edges come in', () => {
    expect(gateButtons(['approve', 'iterate']).map((b) => b.kind)).toEqual(['iterate', 'approve']);
  });

  it('turns any other edge into an extra button, before the two, labelled in title case', () => {
    expect(gateButtons(['iterate', 'skip', 'approve', 'start_over'])).toEqual([
      { edge: 'skip', kind: 'other', label: 'Skip' },
      { edge: 'start_over', kind: 'other', label: 'Start Over' },
      { edge: 'iterate', kind: 'iterate', label: 'Try Again with My Notes' },
      { edge: 'approve', kind: 'approve', label: 'Approve Selected' },
    ]);
  });

  it('treats a proceed edge as approve, as the repo\'s own workflows spell it', () => {
    expect(gateButtons(['iterate', 'proceed'])).toEqual([
      { edge: 'iterate', kind: 'iterate', label: 'Try Again with My Notes' },
      { edge: 'proceed', kind: 'approve', label: 'Approve Selected' },
    ]);
  });

  it('recognises the two edges whatever their case, and sends the edge as the gate spelled it', () => {
    expect(gateButtons([' Approve '])).toEqual([{ edge: ' Approve ', kind: 'approve', label: 'Approve Selected' }]);
  });

  it('is empty for a gate with no edges', () => {
    expect(gateButtons([])).toEqual([]);
  });
});

describe('decisionLabel', () => {
  it('words the two known decisions plainly and leaves any other as the gate named it', () => {
    expect(decisionLabel('approve')).toBe('Approved');
    expect(decisionLabel('iterate')).toBe('Sent back');
    expect(decisionLabel('proceed')).toBe('Approved');
    expect(decisionLabel('skip')).toBe('skip');
  });
});

describe('isApproveDecision', () => {
  it('is true for approve and proceed in any case, false for anything else', () => {
    expect(isApproveDecision('approve')).toBe(true);
    expect(isApproveDecision(' Proceed ')).toBe(true);
    expect(isApproveDecision('iterate')).toBe(false);
    expect(isApproveDecision('skip')).toBe(false);
  });
});

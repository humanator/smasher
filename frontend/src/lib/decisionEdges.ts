// ABOUTME: Turns a gallery gate's outgoing edges into the Decision bar's buttons, and a recorded decision into plain words
// ABOUTME: iterate and approve are the two known decisions (proceed counts as approve); any other edge becomes an extra button so no route is lost

export type GateButtonKind = 'iterate' | 'approve' | 'other';

export interface GateButton {
  /** The edge exactly as the gate spells it; this is the decision that is submitted. */
  edge: string;
  kind: GateButtonKind;
  label: string;
}

const ITERATE_LABEL = 'Try Again with My Notes';
const APPROVE_LABEL = 'Approve Selected';

/** The repo's own workflows spell approval `proceed`; the gallery's own spelling is `approve`. */
export function isApproveDecision(decision: string): boolean {
  const name = decision.trim().toLowerCase();
  return name === 'approve' || name === 'proceed';
}

function kindOf(edge: string): GateButtonKind {
  if (isApproveDecision(edge)) return 'approve';
  return edge.trim().toLowerCase() === 'iterate' ? 'iterate' : 'other';
}

function titleCase(edge: string): string {
  return edge
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/** Extra buttons first, then iterate, then approve: the main action sits at the end. */
export function gateButtons(edges: readonly string[]): GateButton[] {
  const buttons = edges.map((edge): GateButton => {
    const kind = kindOf(edge);
    const label = kind === 'iterate' ? ITERATE_LABEL : kind === 'approve' ? APPROVE_LABEL : titleCase(edge);
    return { edge, kind, label };
  });
  const rank = { other: 0, iterate: 1, approve: 2 };
  return buttons.sort((a, b) => rank[a.kind] - rank[b.kind]);
}

/** "Approved" or "Sent back" for the two known decisions; any other as the gate named it. */
export function decisionLabel(decision: string): string {
  const kind = kindOf(decision);
  return kind === 'approve' ? 'Approved' : kind === 'iterate' ? 'Sent back' : decision;
}

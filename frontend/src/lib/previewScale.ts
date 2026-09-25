// ABOUTME: Sizing for the candidate lightbox: the capture viewport, scaled down to fit the window
// ABOUTME: Pure functions so the fit maths is unit-tested without a DOM

export interface Viewport {
  width: number;
  height: number;
}

// render-capture shoots 1280×800; older or hand-written manifests may lack a viewport.
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

export function viewportOf(manifest: Record<string, unknown> | undefined): Viewport {
  const v = manifest?.viewport as Partial<Viewport> | undefined;
  if (typeof v?.width === 'number' && v.width > 0 && typeof v.height === 'number' && v.height > 0) {
    return { width: v.width, height: v.height };
  }
  return DEFAULT_VIEWPORT;
}

// Never above 1: a small design is shown at its real size, not blown up.
export function fitScale(viewport: Viewport, box: Viewport): number {
  return Math.min(1, box.width / viewport.width, box.height / viewport.height);
}

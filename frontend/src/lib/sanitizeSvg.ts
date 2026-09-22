// ABOUTME: Strips script tags, on* handlers, and javascript: hrefs from SVG markup
// ABOUTME: Used before {@html}-injecting the server-rendered graph SVG into the DOM

const DANGEROUS_TAGS = ['script'];
const JAVASCRIPT_SCHEME = /^\s*javascript:/i;

export function sanitizeSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(`<body>${svg}</body>`, 'text/html');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    return '';
  }

  for (const tag of DANGEROUS_TAGS) {
    svgEl.querySelectorAll(tag).forEach((el) => el.remove());
  }

  for (const el of [svgEl, ...Array.from(svgEl.querySelectorAll('*'))]) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const isEventHandler = name.startsWith('on');
      const isScriptHref =
        (name === 'href' || name === 'xlink:href') && JAVASCRIPT_SCHEME.test(attr.value);
      if (isEventHandler || isScriptHref) {
        el.removeAttribute(attr.name);
      }
    }
  }

  return svgEl.outerHTML;
}

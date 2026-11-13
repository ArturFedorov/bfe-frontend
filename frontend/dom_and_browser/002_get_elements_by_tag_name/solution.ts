/**
 * Reference solution for 002 — getElementsByTagName.
 *
 * Depth-first, pre-order walk over the DESCENDANTS of `root`, collecting the
 * elements whose tag matches. Matching is case-insensitive (HTML tag names are
 * case-insensitive; `el.tagName` is upper-cased in HTML documents), and `"*"`
 * matches every element.
 */
export function getElementsByTagName(root: any, tagName: string): any[] {
  const result: any[] = [];
  const wildcard = tagName === '*';
  const wanted = tagName.toUpperCase(); // normalise once, not per element

  const walk = (el: any): void => {
    for (const child of el.children ?? []) {
      if (wildcard || String(child.tagName).toUpperCase() === wanted) {
        result.push(child);
      }
      walk(child);
    }
  };

  walk(root); // root is never a candidate — only its descendants
  return result;
}

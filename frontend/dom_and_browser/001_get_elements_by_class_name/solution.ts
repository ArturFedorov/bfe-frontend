/**
 * Reference solution for 001 — getElementsByClassName.
 *
 * Depth-first, pre-order walk over the DESCENDANTS of `root` (the root itself
 * is excluded, exactly like the native API), collecting every element whose
 * class list contains `className`. Pre-order DFS == document order.
 */

/** Does `el` carry the class? Prefer classList; fall back to parsing className. */
function hasClass(el: any, className: string): boolean {
  if (el.classList && typeof el.classList.contains === 'function') {
    return el.classList.contains(className);
  }
  // `className` is a space-separated string: split on any whitespace run.
  const classes: string[] = String(el.className ?? '').split(/\s+/);
  return classes.includes(className);
}

export function getElementsByClassName(root: any, className: string): any[] {
  const result: any[] = [];

  const walk = (el: any): void => {
    // `children` holds element nodes only (no text nodes), so no nodeType check.
    for (const child of el.children ?? []) {
      if (hasClass(child, className)) result.push(child);
      walk(child); // visit the child's subtree before moving to the next sibling
    }
  };

  walk(root); // root's own class is never tested — only its descendants'
  return result;
}

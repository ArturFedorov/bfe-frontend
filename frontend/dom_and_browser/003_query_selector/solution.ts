/**
 * Reference solution for 003 — querySelector (subset).
 *
 * Supported: tag (`p`), class (`.intro`), id (`#first`), compound simple
 * selectors (`p.intro#first`), and the descendant combinator (`div p`).
 *
 * Strategy:
 *  1. Parse the selector into a list of "simple selectors", one per
 *     whitespace-separated token (`"div p"` → [div, p]).
 *  2. Depth-first walk the descendants of `root`, carrying the stack of
 *     ancestors seen so far (the mock nodes have no `parentNode`, and carrying
 *     the path is cheaper than walking up anyway).
 *  3. An element matches when it satisfies the LAST simple selector and the
 *     remaining selectors can be matched, right to left, against its ancestor
 *     chain (each one by some strictly-closer-to-root ancestor).
 *  4. Return the first match — pre-order DFS is document order.
 */

/** One token like `p`, `.a`, `#x`, or a compound `p.a.b#x`. */
interface SimpleSelector {
  tag: string | null; // upper-cased, or null when any tag is fine
  id: string | null;
  classes: string[];
}

function parseSimple(token: string): SimpleSelector {
  const simple: SimpleSelector = { tag: null, id: null, classes: [] };
  // Split into "tag", ".class" and "#id" pieces while keeping the prefix char.
  const pieces = token.match(/[.#]?[^.#]+/g) ?? [];
  for (const piece of pieces) {
    if (piece.startsWith('#')) simple.id = piece.slice(1);
    else if (piece.startsWith('.')) simple.classes.push(piece.slice(1));
    else if (piece !== '*') simple.tag = piece.toUpperCase();
  }
  return simple;
}

function matchesSimple(el: any, s: SimpleSelector): boolean {
  if (s.tag !== null && String(el.tagName).toUpperCase() !== s.tag)
    return false;
  if (s.id !== null && el.id !== s.id) return false;
  return s.classes.every((cls) => el.classList?.contains(cls));
}

/**
 * Does `ancestors` (root → parent order) satisfy `selectors[0..last]`?
 * Walk both from the end: each selector must be matched by an ancestor
 * closer to the root than the one that matched the previous selector.
 */
function ancestorsMatch(
  ancestors: any[],
  selectors: SimpleSelector[],
): boolean {
  let a = ancestors.length - 1;
  for (let s = selectors.length - 1; s >= 0; s--) {
    while (a >= 0 && !matchesSimple(ancestors[a], selectors[s])) a--;
    if (a < 0) return false; // ran out of ancestors before matching this part
    a--; // the next part needs a *different*, higher ancestor
  }
  return true;
}

export function querySelector(root: any, selector: string): any | null {
  const parts = selector.trim().split(/\s+/).filter(Boolean).map(parseSimple);
  if (parts.length === 0) return null;

  const last = parts[parts.length - 1];
  const ancestorParts = parts.slice(0, -1);

  // `path` is the ancestor chain from root down to the current element's parent.
  // The root itself is a legitimate ancestor for the combinator, as in the DOM
  // where `el.querySelector('div p')` may match a <div> above `el`.
  const search = (el: any, path: any[]): any | null => {
    for (const child of el.children ?? []) {
      if (matchesSimple(child, last) && ancestorsMatch(path, ancestorParts)) {
        return child; // first match in document order
      }
      path.push(child);
      const found = search(child, path);
      path.pop();
      if (found) return found;
    }
    return null;
  };

  return search(root, [root]);
}

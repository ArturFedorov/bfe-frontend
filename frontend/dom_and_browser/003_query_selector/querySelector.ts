interface SimpleSelector {
  tag: string | null;
  id: string | null;
  classes: string[];
}

function parseSimple(token: string): SimpleSelector {
  const simple: SimpleSelector = { tag: null, id: null, classes: [] };
  const pieces = token.match(/[.#]?[^.#]+/g) ?? [];
  for(const piece of pieces) {
    if(piece.startsWith('#')) simple.id = piece.slice(1);
    else if(piece.startsWith('.')) simple.classes.push(piece.slice(1));
    else if(piece !== '*') simple.tag = piece.toUpperCase();
  }

  return simple;
}

function matchesSimple(el: any, s: SimpleSelector): boolean {
  if(s.tag !== null && String(el.tagName).toUpperCase() !== s.tag) {
    return false;
  }
  if(s.id !== null && el.id !== s.id) return false;
  return s.classes.every((cls) => el.classList?.contains(cls));
}

function ancestorsMatch(
  ancestors: any[],
  selectors: SimpleSelector[],
): boolean {
  let a = ancestors.length - 1;
  for(let s = selectors.length -1; s >= 0; s--) {
    while(a >= 0 && !matchesSimple(ancestors[a], selectors[s])) a--;
    if(a < 0) return false;
    a--;
  }
  return true;
}

export function querySelector(root: any, selector: string): any | null {
  const parts = selector.trim().split(/\s+/).filter(Boolean).map(parseSimple);
  if(parts.length === 0) return null;

  const last = parts[parts.length - 1];
  const ancestorParts = parts.slice(0, -1);

  const search = (el: any, path: any[]): any | null => {
    for(const child of el.children ?? []) {
      if(matchesSimple(child, last) && ancestorsMatch(path, ancestorParts)) {
        return child;
      }

      path.push(child);
      const found = search(child, path);
      path.pop();
      if(found) return found;
    }

    return null;
  }

  return search(root, [root]);
}

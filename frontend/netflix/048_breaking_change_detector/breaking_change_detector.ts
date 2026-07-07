export interface ApiSurface {
  // exported name -> a signature string (e.g. '(a: number) => string')
  [name: string]: string;
}

export interface ApiDiff {
  removed: string[]; // exports gone in the new version (breaking)
  changed: string[]; // exports whose signature changed (breaking)
  added: string[]; // new exports (non-breaking)
}

/**
 * Compare two versions of a package's public API surface and classify changes.
 * `removed` and `changed` are breaking; `added` is not.
 */
export function detectBreakingChanges(
  before: ApiSurface,
  after: ApiSurface,
): ApiDiff {
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);

  const results: ApiDiff = {
    removed: [],
    changed: [],
    added: [],
  };

  const keys = new Set([...beforeKeys, ...afterKeys]);

  for (const key of keys) {
    const isAdded = !(key in before) && key in after;
    const isRemoved = key in before && !(key in after);
    const hasBoth = key in before && key in after;
    const hasChanged = hasBoth && before[key] !== after[key];

    if (isAdded) {
      results.added.push(key);
    }

    if (isRemoved) {
      results.removed.push(key);
    }

    if (hasChanged) {
      results.changed.push(key);
    }
  }

  return results;
}

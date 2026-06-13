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
  // TODO: implement
  throw new Error('Not implemented');
}

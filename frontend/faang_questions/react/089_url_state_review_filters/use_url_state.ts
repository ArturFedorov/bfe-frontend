/** How one URL query parameter maps to and from a typed value. */
export type UrlParamSchema<V> = {
  /** Must never throw — return `default` for missing/invalid input. */
  parse: (raw: string | null) => V;
  /** `null` means "omit this key from the URL". */
  serialize: (value: V) => string | null;
  default: V;
};

export type UrlSchema<T> = { [K in keyof T]: UrlParamSchema<T[K]> };

export type SetUrlStateOptions = {
  /** `true` → `history.replaceState` (no new entry); default `false` → `history.pushState`. */
  replace?: boolean;
};

export type SetUrlState<T> = (
  partial: Partial<T>,
  options?: SetUrlStateOptions,
) => void;

/** Pure: `?page=2&status=approved` → typed state; missing/invalid keys fall back to defaults. */
export function parseUrlState<T extends object>(
  _schema: UrlSchema<T>,
  _search: string,
): T {
  throw new Error('Not implemented');
}

/** Pure: typed state → `?a=b` string (or `''`); keys equal to their default are omitted. */
export function serializeUrlState<T extends object>(
  _schema: UrlSchema<T>,
  _state: T,
): string {
  throw new Error('Not implemented');
}

/**
 * Typed state mirrored into `window.location.search` via the History API.
 * Reads the URL on mount, writes on `setState`, and follows Back/Forward via `popstate`.
 */
export function useUrlState<T extends object>(
  _schema: UrlSchema<T>,
): [T, SetUrlState<T>] {
  throw new Error('Not implemented');
}

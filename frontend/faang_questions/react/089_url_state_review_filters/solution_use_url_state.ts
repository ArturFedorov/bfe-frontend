import { useCallback, useEffect, useRef, useState } from 'react';

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

const schemaKeys = <T extends object>(schema: UrlSchema<T>) =>
  Object.keys(schema) as Array<keyof T & string>;

/** Pure: `?page=2&status=approved` → typed state; missing/invalid keys fall back to defaults. */
export function parseUrlState<T extends object>(
  schema: UrlSchema<T>,
  search: string,
): T {
  const params = new URLSearchParams(search);
  const state = {} as T;
  for (const key of schemaKeys(schema)) {
    // `get` returns the first occurrence (or null); the schema's parse owns the fallback.
    state[key] = schema[key].parse(params.get(key));
  }
  return state;
}

/** Pure: typed state → `?a=b` string (or `''`); keys equal to their default are omitted. */
export function serializeUrlState<T extends object>(
  schema: UrlSchema<T>,
  state: T,
): string {
  const params = new URLSearchParams();
  for (const key of schemaKeys(schema)) {
    const entry = schema[key];
    const value = entry.serialize(state[key]);
    if (value === null) continue; // "omit me"
    if (value === entry.serialize(entry.default)) continue; // clean URLs: defaults are implicit
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Typed state mirrored into `window.location.search` via the History API.
 * Reads the URL on mount, writes on `setState`, and follows Back/Forward via `popstate`.
 *
 * The URL is the source of truth: React state is a parsed mirror of it. The
 * hook never writes on mount, so a link with invalid params renders the
 * fallbacks without rewriting history.
 */
export function useUrlState<T extends object>(
  schema: UrlSchema<T>,
): [T, SetUrlState<T>] {
  const [state, setLocalState] = useState<T>(() =>
    parseUrlState(schema, window.location.search),
  );

  // Refs so `setState` is stable and two calls in the same tick merge correctly.
  const stateRef = useRef(state);
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  useEffect(() => {
    const onPopState = () => {
      const next = parseUrlState(schemaRef.current, window.location.search);
      stateRef.current = next;
      setLocalState(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setState = useCallback<SetUrlState<T>>((partial, options) => {
    const next = { ...stateRef.current, ...partial };
    stateRef.current = next;
    setLocalState(next);

    // Only the search part changes; pathname and hash are preserved.
    const { pathname, hash } = window.location;
    const url = `${pathname}${serializeUrlState(schemaRef.current, next)}${hash}`;
    if (options?.replace)
      window.history.replaceState(window.history.state, '', url);
    else window.history.pushState(null, '', url);
  }, []);

  return [state, setState];
}

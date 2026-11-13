import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';

export type Flags = Record<string, boolean>;

export const OVERRIDES_STORAGE_KEY = 'flag-overrides';

export interface FlagsProviderProps {
  /** Server-provided flags. Replacing the object propagates to consumers. */
  flags: Flags;
  /** Where overrides are persisted (e.g. `window.localStorage`). In-memory when omitted. */
  storage?: Storage;
  children: ReactNode;
}

export interface FlagOverrideApi {
  /** `null` clears the override for `name`. */
  set(name: string, value: boolean | null): void;
  overrides: Readonly<Flags>;
}

export interface FeatureProps {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The provider owns one of these and hands it down through context. The
 * context value never changes, so consumers only re-render through their
 * `useSyncExternalStore` subscription — and only when *their* selection changes.
 */
interface FlagStore {
  subscribe(listener: () => void): () => void;
  /** Effective flags (`override ?? base`), recomputed once per change; stable in between. */
  getSnapshot(): Readonly<Flags>;
  getOverrides(): Readonly<Flags>;
  setBase(flags: Flags): void;
  setOverride(name: string, value: boolean | null): void;
}

const EMPTY_FLAGS: Readonly<Flags> = Object.freeze({});

/** Only a JSON object of booleans is accepted; anything else (or a parse error) means "no overrides". */
function readStoredOverrides(storage: Storage | undefined): Flags {
  if (!storage) return {};
  try {
    const raw = storage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const overrides: Flags = {};
    for (const [name, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') overrides[name] = value;
    }
    return overrides;
  } catch {
    return {};
  }
}

function createFlagStore(initialFlags: Flags, storage: Storage | undefined): FlagStore {
  let base: Flags = initialFlags;
  let overrides: Flags = readStoredOverrides(storage);
  let effective: Readonly<Flags> = Object.freeze({ ...base, ...overrides });
  const listeners = new Set<() => void>();

  const recompute = () => {
    effective = Object.freeze({ ...base, ...overrides });
    for (const listener of listeners) listener();
  };

  const persist = () => {
    if (!storage) return;
    try {
      storage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // Quota exceeded / private mode: keep the in-memory override, just don't persist.
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => effective,
    getOverrides: () => overrides,
    setBase(flags) {
      if (flags === base) return;
      base = flags;
      recompute();
    },
    setOverride(name, value) {
      const has = Object.prototype.hasOwnProperty.call(overrides, name);
      if (value === null ? !has : has && overrides[name] === value) return; // no change → no notification
      const next = { ...overrides };
      if (value === null) delete next[name];
      else next[name] = value;
      overrides = next;
      persist();
      recompute();
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

const FlagsContext = createContext<FlagStore | null>(null);

export function FlagsProvider({ flags, storage, children }: FlagsProviderProps): ReactElement {
  // The store, not the flag map, is the context value: it is created once and
  // never changes identity, so a flag change cannot re-render the whole tree.
  const [store] = useState(() => createFlagStore(flags, storage));

  // Push prop changes into the store after commit (layout, so consumers update
  // before paint). Doing it during render would notify subscribers mid-render.
  useLayoutEffect(() => {
    store.setBase(flags);
  }, [store, flags]);

  return <FlagsContext.Provider value={store}>{children}</FlagsContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/** Stand-in store for consumers rendered outside a provider: everything is `false`, nothing ever changes. */
const NO_PROVIDER_STORE: FlagStore = {
  subscribe: () => () => {},
  getSnapshot: () => EMPTY_FLAGS,
  getOverrides: () => EMPTY_FLAGS,
  setBase: () => {},
  setOverride: () => {},
};

const warnedFlags = new Set<string>();

function warnMissingProviderOnce(name: string): void {
  if (warnedFlags.has(name)) return;
  warnedFlags.add(name);
  console.warn(`useFlag("${name}") was called outside a <FlagsProvider>; returning false.`);
}

/** Effective value of one flag (override ?? provider flag ?? false). */
export function useFlag(name: string): boolean {
  const store = useContext(FlagsContext);
  const hasProvider = store !== null;

  useEffect(() => {
    if (!hasProvider) warnMissingProviderOnce(name);
  }, [hasProvider, name]);

  return useFlags((flags) => flags[name] ?? false);
}

/** Select from the effective flag map; re-renders only when the selection changes. */
export function useFlags<T>(
  selector: (flags: Readonly<Flags>) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useContext(FlagsContext) ?? NO_PROVIDER_STORE;

  // Selector memoisation (what `useSyncExternalStore/with-selector` does):
  // `getSnapshot` must return a referentially stable value, but a selector
  // returning a fresh object every call would never be stable. Cache the last
  // (snapshot, selection) and reuse the previous selection when `equalityFn`
  // says nothing changed.
  const cache = useRef<{ snapshot: Readonly<Flags>; selector: typeof selector; selection: T } | null>(null);

  const getSelection = () => {
    const snapshot = store.getSnapshot();
    const previous = cache.current;
    if (previous && previous.snapshot === snapshot && previous.selector === selector) return previous.selection;

    const next = selector(snapshot);
    const selection = previous && equalityFn(previous.selection, next) ? previous.selection : next;
    cache.current = { snapshot, selector, selection };
    return selection;
  };

  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}

export function useFlagOverride(): FlagOverrideApi {
  const store = useContext(FlagsContext);
  if (!store) throw new Error('useFlagOverride must be used inside a <FlagsProvider>');

  const overrides = useSyncExternalStore(store.subscribe, store.getOverrides, store.getOverrides);
  const set = useCallback((name: string, value: boolean | null) => store.setOverride(name, value), [store]);

  return useMemo(() => ({ set, overrides }), [set, overrides]);
}

/* -------------------------------------------------------------------------- */
/* Feature                                                                    */
/* -------------------------------------------------------------------------- */

export function Feature({ flag, fallback = null, children }: FeatureProps): ReactElement | null {
  const on = useFlag(flag);
  if (on) return <>{children}</>;
  return fallback === null || fallback === undefined ? null : <>{fallback}</>;
}

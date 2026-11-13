import { useCallback, useRef, useSyncExternalStore } from 'react';

export type Listener = () => void;

/** Either a partial object or a function from current state to a partial. */
export type StoreUpdate<S> = Partial<S> | ((state: S) => Partial<S>);

export interface Store<S extends object> {
  getState(): S;
  /** Shallow-merges the update and notifies subscribers synchronously (once per call). */
  setState(update: StoreUpdate<S>): void;
  /** Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void;
  /** Defers notification until the outermost batch finishes: N setStates → 1 notification. */
  batch(fn: () => void): void;
  /** Number of active subscribers — exposed for tests. */
  listenerCount(): number;
}

export type EqualityFn<T> = (a: T, b: T) => boolean;

/** Shallow equality for plain objects and arrays; `Object.is` for everything else. */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  )
    return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    )
      return false;
  }
  return true;
}

/**
 * Minimal external store: one immutable state object, a Set of listeners,
 * synchronous notification and a depth-counted `batch`.
 */
export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<Listener>();
  let batchDepth = 0;
  let notifyPending = false;

  const notify = () => {
    // Iterate over a copy so a listener may unsubscribe (itself or others) mid-notification.
    for (const listener of Array.from(listeners)) listener();
  };

  return {
    getState: () => state,

    setState(update) {
      const partial = typeof update === 'function' ? update(state) : update;
      state = { ...state, ...partial }; // replace, never mutate; nested objects are replaced
      if (batchDepth > 0) notifyPending = true;
      else notify();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener); // idempotent: deleting twice is a no-op
      };
    },

    batch(fn) {
      batchDepth += 1;
      try {
        fn();
      } finally {
        // Runs even when `fn` throws, so the depth is reset and the pending
        // notification still flushes exactly once at the outermost level.
        batchDepth -= 1;
        if (batchDepth === 0 && notifyPending) {
          notifyPending = false;
          notify();
        }
      }
    },

    listenerCount: () => listeners.size,
  };
}

/** Per-hook snapshot cache: keeps `getSnapshot` referentially stable for unchanged slices. */
interface SliceCache<S, T> {
  state: S;
  selector: (state: S) => T;
  selected: T;
}

/**
 * Subscribe a component to a slice of the store. Re-renders only when
 * `equalityFn(prevSlice, nextSlice)` is false (default `Object.is`).
 *
 * Built on `useSyncExternalStore`, which re-reads the snapshot after
 * subscribing and renders store updates synchronously — so a selector that
 * reads two fields written in one `setState`/`batch` never sees a torn pair,
 * even inside `startTransition`.
 */
export function useStore<S extends object, T>(
  store: Store<S>,
  selector: (state: S) => T,
  equalityFn: EqualityFn<T> = Object.is,
): T {
  const cacheRef = useRef<SliceCache<S, T> | null>(null);

  const getSnapshot = (): T => {
    const state = store.getState();
    const cache = cacheRef.current;

    // Same state and same selector → same slice, no work.
    if (cache && cache.state === state && cache.selector === selector)
      return cache.selected;

    const next = selector(state);
    // Slice "equal" per equalityFn → keep the previous reference so React
    // sees an unchanged snapshot and skips the render (also covers fresh
    // object slices and selectors recreated on every render).
    if (cache && equalityFn(cache.selected, next)) {
      cacheRef.current = { state, selector, selected: cache.selected };
      return cache.selected;
    }

    cacheRef.current = { state, selector, selected: next };
    return next;
  };

  const subscribe = useCallback(
    (listener: Listener) => store.subscribe(listener),
    [store],
  );

  // The server snapshot is the same read: the store already holds the state to render.
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

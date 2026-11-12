import { useRef, useSyncExternalStore } from 'react';

/**
 * A minimal external store. Three ideas, nothing more:
 *  - `setState` accepts a partial or an updater and shallow-merges;
 *  - listeners fire once per *change* (a no-op set does not notify);
 *  - `batch` coalesces several sets into a single notification.
 */

export type Listener<S> = (state: S, previous: S) => void;

export type Updater<S> = Partial<S> | ((previous: S) => Partial<S>);

export interface Store<S extends object> {
  getState(): S;
  setState(update: Updater<S>): void;
  subscribe(listener: Listener<S>): () => void;
  /** Run `fn`; listeners are notified at most once, after it returns. Nestable. */
  batch(fn: () => void): void;
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<Listener<S>>();
  let depth = 0;
  let pendingPrevious: S | null = null;

  function notify(previous: S): void {
    for (const listener of Array.from(listeners)) listener(state, previous);
  }

  return {
    getState: () => state,
    setState(update) {
      const partial = typeof update === 'function' ? update(state) : update;
      let changed = false;
      for (const key of Object.keys(partial) as (keyof S)[]) {
        if (!Object.is(state[key], partial[key])) {
          changed = true;
          break;
        }
      }
      if (!changed) return;
      const previous = state;
      state = { ...state, ...partial };
      if (depth > 0) {
        if (pendingPrevious === null) pendingPrevious = previous;
        return;
      }
      notify(previous);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    batch(fn) {
      depth += 1;
      try {
        fn();
      } finally {
        depth -= 1;
        if (depth === 0 && pendingPrevious !== null) {
          const previous = pendingPrevious;
          pendingPrevious = null;
          if (previous !== state) notify(previous);
        }
      }
    },
  };
}

/**
 * Subscribe a component to a slice of the store. The component re-renders
 * only when `selector(state)` changes according to `equalityFn` (default
 * `Object.is`). The last selected value is memoised per state reference so
 * `useSyncExternalStore` sees a stable snapshot between changes.
 */
export function useStore<S extends object, T>(
  store: Store<S>,
  selector: (state: S) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): T {
  const cache = useRef<{ state: S; selected: T } | null>(null);

  const getSnapshot = (): T => {
    const state = store.getState();
    const cached = cache.current;
    if (cached && cached.state === state) return cached.selected;
    const selected = selector(state);
    if (cached && equalityFn(cached.selected, selected)) {
      cache.current = { state, selected: cached.selected };
      return cached.selected;
    }
    cache.current = { state, selected };
    return selected;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

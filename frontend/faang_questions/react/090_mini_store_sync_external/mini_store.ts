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
export function shallowEqual(_a: unknown, _b: unknown): boolean {
  throw new Error('Not implemented');
}

export function createStore<S extends object>(_initial: S): Store<S> {
  throw new Error('Not implemented');
}

/**
 * Subscribe a component to a slice of the store. Re-renders only when
 * `equalityFn(prevSlice, nextSlice)` is false (default `Object.is`).
 */
export function useStore<S extends object, T>(
  _store: Store<S>,
  _selector: (state: S) => T,
  _equalityFn?: EqualityFn<T>,
): T {
  throw new Error('Not implemented');
}

import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
}

export interface UseAsyncResult<
  T,
  Args extends unknown[],
> extends UseAsyncState<T> {
  run: (...args: Args) => Promise<void>;
}

/**
 * Explicit idle / loading / success / error state machine around any
 * promise-returning function, where only the LATEST run may settle into state.
 *
 *  - `runIdRef` is a monotonically increasing counter. Each `run()` takes the
 *    next id and, after awaiting, compares it with the current one: if a
 *    newer run started in the meantime this one lost the race and bails —
 *    for both resolution and rejection.
 *  - `fnRef` always holds the latest `fn` so `run` can be `useCallback(…, [])`
 *    (stable identity) without ever calling a stale function.
 *  - `run` never throws: rejections are captured into state, and the returned
 *    promise resolves once the run has been fully processed.
 */
export function useAsync<T, Args extends unknown[] = []>(
  fn: (...args: Args) => Promise<T>,
): UseAsyncResult<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  // "Latest ref" pattern: updated after every commit, read at call time.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const runIdRef = useRef(0);

  const run = useCallback(async (...args: Args): Promise<void> => {
    const id = ++runIdRef.current;
    // Entering loading clears previous data/error so the three fields can
    // never disagree with `status`.
    setState({ status: 'loading', data: null, error: null });

    try {
      const data = await fnRef.current(...args);
      if (id !== runIdRef.current) return; // a newer run owns the state now
      setState({ status: 'success', data, error: null });
    } catch (err: unknown) {
      if (id !== runIdRef.current) return; // stale rejection — also discarded
      setState({
        status: 'error',
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  return { ...state, run };
}

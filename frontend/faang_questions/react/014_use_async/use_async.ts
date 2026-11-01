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

export function useAsync<T, Args extends unknown[] = []>(
  fn: (...args: Args) => Promise<T>,
): UseAsyncResult<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const runIdRef = useRef(0);

  const run = useCallback(async (...args: Args): Promise<void> => {
    const id = ++runIdRef.current;
    setState({ status: 'loading', data: null, error: null });

    try {
      const data = await fnRef.current(...args);
      if (id !== runIdRef.current) return;
      setState({ status: 'success', data, error: null });
    } catch (err: unknown) {
      if (id !== runIdRef.current) return;
      setState({
        status: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
        data: null,
      });
    }
  }, []);

  return {
    ...state,
    run,
  };
}

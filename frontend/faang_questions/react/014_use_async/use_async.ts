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
  const runIdRef = useRef(0);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const run = useCallback(async (...args: Args): Promise<void> => {
    const id = ++runIdRef.current;

    setState({ status: 'loading', data: null, error: null });

    try {
      const data = await fnRef.current(...args);
      if (id !== runIdRef.current) return;
      setState({ data, status: 'success', error: null });
    } catch (err: unknown) {
      if (id !== runIdRef.current) return;
      setState({
        status: 'error',
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  return {
    ...state,
    run,
  };
}

import { useCallback, useEffect, useState } from 'react';
import { AbortError } from '../../../../algo/072_cancellable_pipeline/solution';

export interface UseFetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface UseFetchResult<T> extends UseFetchState<T> {
  refetch: () => void;
}

export function useFetch<T = unknown>(url: string): UseFetchResult<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    error: null,
    loading: false,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setState({ data: null, error: null, loading: true });

    const controller = new AbortController();
    const { signal } = controller;

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (signal.aborted) return;
        setState({
          data,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      controller.abort();
    };
  }, [url, tick]);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return {
    ...state,
    refetch,
  };
}

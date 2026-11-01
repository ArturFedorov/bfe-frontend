import { useCallback, useEffect, useState } from 'react';

export interface UseFetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface UseFetchResult<T> extends UseFetchState<T> {
  refetch: () => void;
}

export function useFetch<T = unknown>(url: string): UseFetchResult<T> {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<UseFetchState<T>>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: null, data: null });
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data: T) => {
        if (!controller.signal.aborted)
          setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          loading: false,
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
    return () => controller.abort();
  }, [url, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    refetch,
  };
}

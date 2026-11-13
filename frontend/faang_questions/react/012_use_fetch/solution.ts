import { useCallback, useEffect, useState } from 'react';

export interface UseFetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface UseFetchResult<T> extends UseFetchState<T> {
  refetch: () => void;
}

/**
 * Fetch JSON from `url` with proper cancellation.
 *
 * Design:
 *  - One effect keyed on `[url, tick]`. Changing `url` or bumping `tick`
 *    (via `refetch`) tears the previous run down and starts a new one.
 *  - Each run owns a single AbortController. Cleanup is `controller.abort()`,
 *    which both cancels the network request and flips `signal.aborted`, the
 *    flag every state write is guarded by. A stale run can therefore never
 *    write state, whether it settles after a url change or after unmount.
 *  - The three fields are always written together as one object so the
 *    hook never exposes a half-updated combination (e.g. loading + data).
 */
export function useFetch<T = unknown>(url: string): UseFetchResult<T> {
  // `tick` exists purely to re-run the effect for the same url.
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    setState({ data: null, error: null, loading: true });

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (signal.aborted) return;
        setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        // Includes the AbortError a real fetch throws after abort(): since
        // we are the ones who aborted, that is not an error to surface.
        if (signal.aborted) return;
        setState({
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
          loading: false,
        });
      });

    return () => controller.abort();
  }, [url, tick]);

  // Stable identity: no deps, and the functional updater needs no closure
  // over the current tick.
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { ...state, refetch };
}

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

export interface SearchResult {
  id: string;
  title: string;
}

/**
 * `idle` is a real state here (empty query, nothing requested) so the panel
 * never has to invent a fake "loading" or "success with []" for it.
 */
export type ResultsPanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; results: SearchResult[] };

export interface ResultsPanelProps {
  /** Current search query; the panel refetches whenever this changes. */
  query: string;
  /** Search endpoint. Defaults to '/api/search'. */
  endpoint?: string;
}

const isBlank = (s: string): boolean => s.trim() === '';

export function ResultsPanel({
  query,
  endpoint = '/api/search',
}: ResultsPanelProps): ReactElement {
  // Lazy initialiser picks the right first frame so a non-empty initial query
  // does not flash "idle" before the effect runs.
  const [state, setState] = useState<ResultsPanelState>(() =>
    isBlank(query) ? { status: 'idle' } : { status: 'loading' }
  );

  useEffect(() => {
    if (isBlank(query)) {
      setState({ status: 'idle' });
      return; // nothing in flight, nothing to clean up
    }

    // One AbortController per effect run. Its signal does double duty:
    //  1. passed to fetch so the network request is actually cancelled, and
    //  2. `signal.aborted` is the "ignore stale result" flag — the cleanup
    //     calls abort(), so anything settling afterwards (older query OR
    //     unmount) sees aborted === true and bails before touching state.
    // Because every run owns its own controller there is no ref and no
    // run-id: the cleanup of run N can only ever abort run N.
    const controller = new AbortController();
    const { signal } = controller;

    setState({ status: 'loading' });

    fetch(`${endpoint}?q=${encodeURIComponent(query)}`, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<SearchResult[]>;
      })
      .then((results) => {
        if (signal.aborted) return;
        setState({ status: 'success', results });
      })
      .catch((err: unknown) => {
        // A real fetch rejects with AbortError once aborted; a mock may just
        // settle late. Either way the aborted check swallows it — an aborted
        // request is not an error the user should see.
        if (signal.aborted) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      });

    return () => controller.abort();
  }, [endpoint, query]);

  switch (state.status) {
    case 'idle':
      return <p>Type to search partners.</p>;

    case 'loading':
      return <p role="status">Searching…</p>;

    case 'error':
      return <p role="alert">{state.message}</p>;

    case 'success':
      if (state.results.length === 0) {
        return <p>No matches for &quot;{query}&quot;.</p>;
      }
      return (
        <ul aria-label="Search results">
          {state.results.map((result) => (
            <li key={result.id}>{result.title}</li>
          ))}
        </ul>
      );
  }
}

import {ReactElement, useEffect, useState} from 'react';

export interface SearchResult {
  id: string;
  title: string;
}

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
  const [state, setState] = useState<ResultsPanelState>(isBlank(query) ? { status: 'idle'} : { status: 'loading' });
  const url = `${endpoint}?q=${encodeURIComponent(query)}`;

  useEffect(() => {
    if(isBlank(query)) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    setState({ status: 'loading' });

    fetch(url, { signal })
      .then((res) => {
        if(!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if(signal.aborted) return;
        setState({ status: 'success', results: data });
      })
      .catch((err: unknown) => {
        if(signal.aborted) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        })
      });

    return () => {
      controller.abort();
    }
  }, [endpoint, query]);


  switch (state.status) {
    case 'idle':
      return <p>Type to search partners.</p>
    case 'loading':
      return <p role="status">Searching…</p>
    case 'error':
      return <p role="alert">{state.message}</p>
    case 'success':
      if(state.results.length === 0) {
        return <p>No matches for &quot;{query}&quot;.</p>;
      }

      return (
        <ul aria-label="Search results">
          {state.results.map((result) => (<li key={result.id}>{result.title}</li>))}
        </ul>
      )
  }
}

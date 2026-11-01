import {ReactElement, useEffect, useRef, useState} from 'react';

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

export function ResultsPanel({
  query,
  endpoint = '/api/search',
}: ResultsPanelProps): ReactElement {
  const abortRef = useRef<AbortController | null>(null);
  const [data, setData] = useState<ResultsPanelState>({ status: 'loading' });

  const isQueryEmpty = /^\s*$/.test(query);

  useEffect(() => {
    if(isQueryEmpty) return;
    let ignore = false;
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setData({ status: 'loading' });

    const url = `${endpoint}?q=${encodeURIComponent(query)}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if(!res.ok)  throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      }).then((data: SearchResult[]) => {
        if(!ignore)  setData({ status: 'success', results: data });
    }).catch((err) => {
      if(ignore || err instanceof Error && err.name === 'AbortError') return;
      setData({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    })

    return () => {
      ignore = true;
      abortRef.current?.abort();
    }
  }, [endpoint, query])

  const render = (state: ResultsPanelState) => {
    switch (state.status) {
      case  'loading':
        return <div role="status">Searching…</div>
      case 'error':
        return <div role="alert">{ state.message }</div>
      case 'success':
        if(state.results.length === 0) return <div>{`No matches for "${query}".`}</div>;
        return <ul aria-label="Search results">
          {state.results.map((result) => <li key={result.id}>{result.title}</li>)}
        </ul>
    }
  }

  return (
    <div>
      {isQueryEmpty && <p>Type to search partners.</p>}
      {!isQueryEmpty && render(data)}
    </div>
  )
}

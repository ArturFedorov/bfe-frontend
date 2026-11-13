import type { ReactElement } from 'react';

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
  // TODO: implement
  throw new Error('Not implemented');
}

import type { ReactElement } from 'react';

export interface Span {
  start: number; // inclusive token index
  end: number; // inclusive token index
  label: string;
}

export interface SpanLabelerProps {
  tokens: string[];
  labels: string[];
  value: Span[];
  onChange: (next: Span[]) => void;
}

export function SpanLabeler(props: SpanLabelerProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

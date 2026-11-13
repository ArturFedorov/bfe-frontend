import { ReactElement } from 'react';

export interface Span {
  id: string;
  /** Inclusive start, in UTF-16 code units (JS string index). Never inside a surrogate pair. */
  start: number;
  /** Exclusive end, in UTF-16 code units. Never inside a surrogate pair. */
  end: number;
  label: string;
}

export interface SpanLabelerProps {
  text: string;
  labels: string[];
  value: Span[];
  onChange: (next: Span[]) => void;
  /** Generates the id for a newly created span. Defaults to `crypto.randomUUID()`. */
  newId?: () => string;
}

export function SpanLabeler(_props: SpanLabelerProps): ReactElement {
  throw new Error('Not implemented');
}

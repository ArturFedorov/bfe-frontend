import type { ReactNode } from 'react';

export interface Partner {
  id: string;
  name: string;
}

export type AsyncResult<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T[] };

export interface AsyncStatesPanelProps {
  result: AsyncResult<Partner>;
  onRetry: () => void;
}

export function AsyncStatesPanel({ result, onRetry }: AsyncStatesPanelProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}

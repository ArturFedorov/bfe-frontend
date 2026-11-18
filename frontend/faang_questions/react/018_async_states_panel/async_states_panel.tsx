import {ReactNode, useState} from 'react';

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

  switch (result.status) {
    case 'loading':
      return <div role="status">Loading partners…</div>
    case 'error':
      return (
        <div>
          <div role="alert">{result.error.message}</div>
          {onRetry && <button type="button" onClick={onRetry}>Retry</button>}
        </div>
      )
    case "success":
      if(result.data.length === 0) {
        return <p>No partners found</p>;
      }

      return (
        <ul role="list">
          {result.data.map((item) => (<li key={item.id}>{item.name}</li>))}
        </ul>
      )
  }
}

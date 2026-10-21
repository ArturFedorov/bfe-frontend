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
  const render = () => {
    switch (result.status) {
      case 'loading':
        return <div role="status">Loading partners…</div>
      case 'error':
        return <>
          <div role="alert">{result.error.message}</div>
          <button onClick={onRetry}>Retry</button>
        </>
      case 'success':
        if(result.data.length === 0) return <div>No partners found</div>
        return <ul aria-label="Partners">
          {result.data.map((item) => <li key={item.id}>{item.name}</li>)}
        </ul>
    }
  }

  return render()
}

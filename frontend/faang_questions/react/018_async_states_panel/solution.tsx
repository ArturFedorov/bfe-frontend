import type { ReactNode } from 'react';

export interface Partner {
  id: string;
  name: string;
}

/**
 * The type IS the design. Each variant carries exactly the payload that state
 * can have, so "loading with data" or "success with an error" is a compile
 * error, not a QA ticket. Empty is derived from `success` with zero rows
 * rather than being a fifth flag that could disagree with `data`.
 */
export type AsyncResult<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T[] };

export interface AsyncStatesPanelProps {
  result: AsyncResult<Partner>;
  onRetry: () => void;
}

export function AsyncStatesPanel({ result, onRetry }: AsyncStatesPanelProps): ReactNode {
  // One switch on the discriminant; TypeScript narrows `result` per branch.
  switch (result.status) {
    case 'loading':
      return <p role="status">Loading partners…</p>;

    case 'error':
      return (
        <div>
          <p role="alert">{result.error.message}</p>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      );

    case 'success':
      if (result.data.length === 0) {
        return <p>No partners found</p>;
      }
      return (
        <ul aria-label="Partners">
          {result.data.map((partner) => (
            <li key={partner.id}>{partner.name}</li>
          ))}
        </ul>
      );

    default: {
      // Exhaustiveness guard: adding a variant (e.g. 'refreshing') to the
      // union makes this line fail to compile until it is handled above.
      const unreachable: never = result;
      return unreachable;
    }
  }
}

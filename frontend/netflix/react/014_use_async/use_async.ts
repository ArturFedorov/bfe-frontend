export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
}

export interface UseAsyncResult<T, Args extends unknown[]> extends UseAsyncState<T> {
  run: (...args: Args) => Promise<void>;
}

export function useAsync<T, Args extends unknown[] = []>(
  fn: (...args: Args) => Promise<T>
): UseAsyncResult<T, Args> {
  // TODO: implement
  throw new Error('Not implemented');
}

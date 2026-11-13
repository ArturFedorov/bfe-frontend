export interface UseFetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface UseFetchResult<T> extends UseFetchState<T> {
  refetch: () => void;
}

export function useFetch<T = unknown>(url: string): UseFetchResult<T> {
  // TODO: implement
  throw new Error('Not implemented');
}

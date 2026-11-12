import { ReactElement, ReactNode } from 'react';

export type QueryKey = readonly unknown[];

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/** Cache entry as seen from outside: `getQueryState` returns a snapshot of it. */
export interface QueryState<T = unknown> {
  data: T | undefined;
  error: Error | null;
  status: QueryStatus;
  isFetching: boolean;
  /** `Date.now()` of the last successful fetch or `setQueryData`; 0 when never set. */
  updatedAt: number;
  /** Set by `invalidateQueries`; cleared by the next successful fetch. */
  isInvalidated: boolean;
}

export type Updater<T> = T | ((previous: T | undefined) => T);

export interface QueryClient {
  getQueryData<T = unknown>(key: QueryKey): T | undefined;
  /** Writes the cache and notifies every mounted observer of that key synchronously. */
  setQueryData<T = unknown>(key: QueryKey, updater: Updater<T>): void;
  /**
   * Marks every entry whose key starts with `keyPrefix` as stale and refetches
   * those with mounted observers. Resolves when those refetches settle.
   */
  invalidateQueries(keyPrefix: QueryKey): Promise<void>;
  /** Snapshot of a cache entry, or `undefined` when the key was never seen. */
  getQueryState<T = unknown>(key: QueryKey): QueryState<T> | undefined;
}

export interface UseQueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Milliseconds a successful result is considered fresh. Default 0 (always stale). */
  staleTime?: number;
  /** When false the query does not fetch and reports status `idle`. Default true. */
  enabled?: boolean;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  status: QueryStatus;
  isFetching: boolean;
  /** Forces a new request for this key regardless of staleness. Never rejects. */
  refetch: () => Promise<void>;
}

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseMutationOptions<TVars, TData, TContext = undefined> {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Runs before `mutationFn`; its return value is handed to the other callbacks (e.g. a rollback snapshot). */
  onMutate?: (vars: TVars) => TContext | Promise<TContext>;
  onError?: (error: Error, vars: TVars, context: TContext | undefined) => void;
  onSuccess?: (data: TData, vars: TVars, context: TContext | undefined) => void;
  onSettled?: (data: TData | undefined, error: Error | null, vars: TVars, context: TContext | undefined) => void;
}

export interface UseMutationResult<TVars> {
  /** Resolves after `onSettled`; never rejects — failures surface through `status` and `error`. */
  mutate: (vars: TVars) => Promise<void>;
  status: MutationStatus;
  error: Error | null;
}

export interface QueryClientProviderProps {
  client: QueryClient;
  children?: ReactNode;
}

/**
 * Stable serialization of a query key: arrays are order-sensitive, plain
 * objects serialize with sorted keys so `{a,b}` and `{b,a}` hash equally.
 */
export function hashQueryKey(_key: QueryKey): string {
  throw new Error('Not implemented');
}

export function createQueryClient(): QueryClient {
  throw new Error('Not implemented');
}

export function QueryClientProvider(_props: QueryClientProviderProps): ReactElement {
  throw new Error('Not implemented');
}

/** The client from the nearest `QueryClientProvider`; throws outside one. */
export function useQueryClient(): QueryClient {
  throw new Error('Not implemented');
}

export function useQuery<T>(_options: UseQueryOptions<T>): UseQueryResult<T> {
  throw new Error('Not implemented');
}

export function useMutation<TVars, TData, TContext = undefined>(
  _options: UseMutationOptions<TVars, TData, TContext>,
): UseMutationResult<TVars> {
  throw new Error('Not implemented');
}

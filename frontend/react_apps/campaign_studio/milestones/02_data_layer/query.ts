/**
 * Milestone 2b — a tiny React Query: cache + observers + mutations.
 * See README.md in this folder. Tests: query.test.tsx.
 */
import type { ReactNode } from 'react';

export type QueryKey = readonly unknown[];

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/** Cache entry as seen from outside: `getQueryState` returns a snapshot of it. */
export interface QueryState<T = unknown> {
  data: T | undefined;
  error: Error | null;
  status: QueryStatus;
  /** True while a request for this key is in flight (initial load or background refetch). */
  isFetching: boolean;
  /** `now()` of the last successful fetch or `setQueryData`; 0 when never set. */
  updatedAt: number;
  /** Set by `invalidateQueries`; cleared by the next successful fetch. */
  isInvalidated: boolean;
}

export type DataUpdater<T> = T | ((previous: T | undefined) => T);

export interface FetchQueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Milliseconds a successful result is considered fresh. Default 0 (always stale). */
  staleTime?: number;
}

export interface QueryClient {
  getQueryData<T = unknown>(key: QueryKey): T | undefined;
  /** Writes the cache (status `success`, `updatedAt = now()`) and notifies observers of that key synchronously. */
  setQueryData<T = unknown>(key: QueryKey, updater: DataUpdater<T>): void;
  /**
   * Marks every entry whose key starts with `keyPrefix` as invalidated and
   * refetches those with mounted observers. Resolves when those refetches settle.
   */
  invalidateQueries(keyPrefix: QueryKey): Promise<void>;
  /** Snapshot of a cache entry, or `undefined` when the key was never seen. */
  getQueryState<T = unknown>(key: QueryKey): QueryState<T> | undefined;
  /**
   * Imperative read: returns cached data when fresh (`now() - updatedAt < staleTime`),
   * otherwise fetches. Concurrent calls for the same key share one in-flight request.
   */
  fetchQuery<T>(options: FetchQueryOptions<T>): Promise<T>;
  /** Drop every cache entry. Mounted observers go back to `loading` on their next fetch. */
  clear(): void;
}

export interface QueryClientOptions {
  /** Clock, injectable for tests. Default `Date.now`. */
  now?: () => number;
}

export function createQueryClient(options?: QueryClientOptions): QueryClient {
  void options;
  throw new Error('Not implemented');
}

/** Serialises a key so `['campaigns', { page: 1 }]` and `['campaigns', { page: 1 }]` hit the same entry. */
export function hashKey(key: QueryKey): string {
  void key;
  throw new Error('Not implemented');
}

/** Standalone helper equivalent to `client.setQueryData(key, updater)`. */
export function setQueryData<T>(
  client: QueryClient,
  key: QueryKey,
  updater: DataUpdater<T>,
): void {
  void client;
  void key;
  void updater;
  throw new Error('Not implemented');
}

/** Standalone helper equivalent to `client.invalidateQueries(keyPrefix)`. */
export function invalidateQueries(
  client: QueryClient,
  keyPrefix: QueryKey,
): Promise<void> {
  void client;
  void keyPrefix;
  throw new Error('Not implemented');
}

export interface QueryClientProviderProps {
  client: QueryClient;
  children: ReactNode;
}

export function QueryClientProvider(
  props: QueryClientProviderProps,
): ReactNode {
  void props;
  throw new Error('Not implemented');
}

/** Throws when used outside a `QueryClientProvider`. */
export function useQueryClient(): QueryClient {
  throw new Error('Not implemented');
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

/**
 * Stale-while-revalidate observer over the client cache:
 *  - cached data renders immediately; a background refetch runs when stale;
 *  - two components with the same key share one request;
 *  - a response for a key the component no longer observes is ignored
 *    (stale-response guard when `queryKey` changes while a fetch is in flight);
 *  - unmount never causes a state update.
 */
export function useQuery<T>(options: UseQueryOptions<T>): UseQueryResult<T> {
  void options;
  throw new Error('Not implemented');
}

export type MutationStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseMutationOptions<TData, TVariables, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Runs before `mutationFn`; its return value is passed to `onError`/`onSuccess`/`onSettled` as `context`. Use it for optimistic writes. */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>;
  /** Use it to roll back what `onMutate` wrote. */
  onError?: (
    error: Error,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>;
}

export interface UseMutationResult<TData, TVariables> {
  /** Fire and forget: resolves after callbacks ran; never rejects (errors go to `error` + `onError`). */
  mutate: (variables: TVariables) => Promise<void>;
  /** Same, but rejects with the error so the caller can await it. */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  status: MutationStatus;
  isPending: boolean;
  data: TData | undefined;
  error: Error | null;
  reset: () => void;
}

export function useMutation<TData, TVariables, TContext = unknown>(
  options: UseMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, TVariables> {
  void options;
  throw new Error('Not implemented');
}

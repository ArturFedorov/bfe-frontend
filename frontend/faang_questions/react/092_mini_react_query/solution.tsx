import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

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

/* -------------------------------------------------------------------------- */
/* hashQueryKey                                                               */
/* -------------------------------------------------------------------------- */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Stable serialization of a query key: arrays are order-sensitive, plain
 * objects serialize with sorted keys so `{a,b}` and `{b,a}` hash equally.
 *
 * `JSON.stringify` already distinguishes `1` from `'1'` and keeps array order;
 * the replacer only has to normalise object key order. It runs for every
 * nested value, so nested objects are normalised too.
 */
export function hashQueryKey(key: QueryKey): string {
  return JSON.stringify(key, (_property, value: unknown) => {
    if (!isPlainObject(value)) return value;
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) sorted[k] = value[k];
    return sorted;
  });
}

/* -------------------------------------------------------------------------- */
/* Client internals                                                           */
/* -------------------------------------------------------------------------- */

type Listener = () => void;

/**
 * One cache entry per hashed key. `state` is the immutable snapshot handed to
 * `useSyncExternalStore`; it is *replaced* (never mutated) on every change so
 * snapshots stay referentially stable between changes. Everything else is
 * non-rendered bookkeeping.
 */
interface Entry {
  key: QueryKey;
  state: QueryState;
  listeners: Set<Listener>;
  /** Monotonic request counter: a response is applied only if it belongs to the newest request. */
  requestId: number;
  /** Promise of the newest request (never rejects); used to dedupe mount-time fetches. */
  inFlight: Promise<void> | null;
  /** Latest `queryFn` seen from an observer — what `invalidateQueries` uses to refetch. */
  queryFn: (() => Promise<unknown>) | null;
}

/** Internal surface the hooks need but the public `QueryClient` does not expose. */
interface ClientInternals {
  ensure(hash: string, key: QueryKey): Entry;
  subscribe(hash: string, listener: Listener): () => void;
  getState(hash: string): QueryState;
  setQueryFn(hash: string, queryFn: () => Promise<unknown>): void;
  /** Mount-time fetch: dedupes against an in-flight request and respects `staleTime` / invalidation. */
  fetchOnMount(hash: string, staleTime: number): Promise<void>;
  /** Forced fetch: always starts a new request, superseding any in-flight one. */
  fetch(hash: string): Promise<void>;
}

/** Internals live behind `createQueryClient`; the hooks look them up by client identity. */
const internalsByClient = new WeakMap<QueryClient, ClientInternals>();

function getInternals(client: QueryClient): ClientInternals {
  const internals = internalsByClient.get(client);
  if (!internals) throw new Error('QueryClient must be created with createQueryClient()');
  return internals;
}

const INITIAL_STATE: QueryState = {
  data: undefined,
  error: null,
  status: 'idle',
  isFetching: false,
  updatedAt: 0,
  isInvalidated: false,
};

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

export function createQueryClient(): QueryClient {
  const entries = new Map<string, Entry>();

  const ensure = (hash: string, key: QueryKey): Entry => {
    let entry = entries.get(hash);
    if (!entry) {
      entry = { key, state: INITIAL_STATE, listeners: new Set(), requestId: 0, inFlight: null, queryFn: null };
      entries.set(hash, entry);
    }
    return entry;
  };

  /** Replace the snapshot and tell every mounted observer of this key, synchronously. */
  const update = (entry: Entry, patch: Partial<QueryState>): void => {
    entry.state = { ...entry.state, ...patch };
    for (const listener of entry.listeners) listener();
  };

  /**
   * Start request `n = ++requestId`. When it settles, apply the result only if
   * no newer request has been started meanwhile — a superseded response must
   * neither overwrite fresher data nor clear `isFetching` while the newest
   * request is still pending.
   */
  const startFetch = (entry: Entry): Promise<void> => {
    const queryFn = entry.queryFn;
    if (!queryFn) return Promise.resolve();
    const requestId = ++entry.requestId;
    update(entry, {
      isFetching: true,
      status: entry.state.status === 'idle' ? 'loading' : entry.state.status,
    });

    const run = async (): Promise<void> => {
      try {
        const data = await queryFn();
        if (entry.requestId !== requestId) return; // superseded → dropped
        update(entry, {
          data,
          error: null,
          status: 'success',
          isFetching: false,
          updatedAt: Date.now(),
          isInvalidated: false,
        });
      } catch (reason) {
        if (entry.requestId !== requestId) return; // superseded → dropped
        // Previous data is kept; only status/error change.
        update(entry, { error: toError(reason), status: 'error', isFetching: false });
      } finally {
        if (entry.requestId === requestId) entry.inFlight = null;
      }
    };

    const promise = run();
    entry.inFlight = promise;
    return promise;
  };

  const isStale = (state: QueryState, staleTime: number): boolean =>
    state.isInvalidated || state.updatedAt === 0 || Date.now() - state.updatedAt >= staleTime;

  const internals: ClientInternals = {
    ensure,
    subscribe(hash, listener) {
      const entry = entries.get(hash);
      if (!entry) return () => {};
      entry.listeners.add(listener);
      return () => {
        entry.listeners.delete(listener);
      };
    },
    getState(hash) {
      return entries.get(hash)?.state ?? INITIAL_STATE;
    },
    setQueryFn(hash, queryFn) {
      const entry = entries.get(hash);
      if (entry) entry.queryFn = queryFn;
    },
    fetchOnMount(hash, staleTime) {
      const entry = entries.get(hash);
      if (!entry) return Promise.resolve();
      if (entry.inFlight) return entry.inFlight; // dedupe: join the request already running
      if (!isStale(entry.state, staleTime)) return Promise.resolve();
      return startFetch(entry);
    },
    fetch(hash) {
      const entry = entries.get(hash);
      return entry ? startFetch(entry) : Promise.resolve();
    },
  };

  const client: QueryClient = {
    getQueryData<T>(key: QueryKey): T | undefined {
      return entries.get(hashQueryKey(key))?.state.data as T | undefined;
    },

    setQueryData<T>(key: QueryKey, updater: Updater<T>): void {
      const entry = ensure(hashQueryKey(key), key);
      const previous = entry.state.data as T | undefined;
      const data =
        typeof updater === 'function' ? (updater as (previous: T | undefined) => T)(previous) : updater;
      update(entry, { data, error: null, status: 'success', updatedAt: Date.now() });
    },

    invalidateQueries(keyPrefix: QueryKey): Promise<void> {
      const prefixHash = hashQueryKey(keyPrefix);
      const refetches: Promise<void>[] = [];
      for (const entry of entries.values()) {
        // Element-wise prefix match, compared by hash so object key order is irrelevant.
        if (entry.key.length < keyPrefix.length) continue;
        if (hashQueryKey(entry.key.slice(0, keyPrefix.length)) !== prefixHash) continue;
        update(entry, { isInvalidated: true });
        // Observed entries refetch now; unobserved ones stay flagged and refetch on their next mount.
        if (entry.listeners.size > 0 && entry.queryFn) refetches.push(startFetch(entry));
      }
      return Promise.all(refetches).then(() => undefined);
    },

    getQueryState<T>(key: QueryKey): QueryState<T> | undefined {
      return entries.get(hashQueryKey(key))?.state as QueryState<T> | undefined;
    },
  };

  internalsByClient.set(client, internals);
  return client;
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

const QueryClientContext = createContext<QueryClient | null>(null);

export function QueryClientProvider({ client, children }: QueryClientProviderProps): ReactElement {
  return <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>;
}

/** The client from the nearest `QueryClientProvider`; throws outside one. */
export function useQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  if (!client) throw new Error('useQueryClient must be used inside a <QueryClientProvider>');
  return client;
}

/* -------------------------------------------------------------------------- */
/* useQuery                                                                   */
/* -------------------------------------------------------------------------- */

export function useQuery<T>({ queryKey, queryFn, staleTime = 0, enabled = true }: UseQueryOptions<T>): UseQueryResult<T> {
  const client = useQueryClient();
  const internals = getInternals(client);
  const hash = hashQueryKey(queryKey);

  // Creating the entry during render is idempotent and notifies nobody, so it
  // is a safe "lazy init" side effect; the snapshot below needs it to exist.
  internals.ensure(hash, queryKey);

  const subscribe = useCallback((listener: Listener) => internals.subscribe(hash, listener), [internals, hash]);
  const getSnapshot = useCallback(() => internals.getState(hash) as QueryState<T>, [internals, hash]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Keep the latest queryFn on the entry (inline functions change identity
  // every render) so refetches triggered by the client use a current one.
  useEffect(() => {
    internals.setQueryFn(hash, queryFn);
  });

  // Mount / key change / enable: fetch if nothing cached, stale, or invalidated.
  useEffect(() => {
    if (!enabled) return;
    void internals.fetchOnMount(hash, staleTime);
  }, [internals, hash, enabled, staleTime]);

  const refetch = useCallback(() => internals.fetch(hash), [internals, hash]);

  // Optimistic result: the effect above will start the first request right
  // after this render, so report it as already loading instead of flashing
  // `idle` for one frame (TanStack's `getOptimisticResult` does the same).
  const willFetchOnMount = enabled && state.status === 'idle' && !state.isFetching;

  return useMemo<UseQueryResult<T>>(
    () => ({
      data: state.data,
      error: state.error,
      status: willFetchOnMount ? 'loading' : state.status,
      isFetching: willFetchOnMount ? true : state.isFetching,
      refetch,
    }),
    [state, willFetchOnMount, refetch],
  );
}

/* -------------------------------------------------------------------------- */
/* useMutation                                                                */
/* -------------------------------------------------------------------------- */

interface MutationState {
  status: MutationStatus;
  error: Error | null;
}

export function useMutation<TVars, TData, TContext = undefined>(
  options: UseMutationOptions<TVars, TData, TContext>,
): UseMutationResult<TVars> {
  const [state, setState] = useState<MutationState>({ status: 'idle', error: null });

  // Callbacks are read through a ref so `mutate` stays stable while always
  // calling the latest options.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const mutate = useCallback(async (vars: TVars): Promise<void> => {
    const { mutationFn, onMutate, onError, onSuccess, onSettled } = optionsRef.current;
    setState({ status: 'loading', error: null });
    let context: TContext | undefined;
    try {
      context = onMutate ? await onMutate(vars) : undefined;
      const data = await mutationFn(vars);
      onSuccess?.(data, vars, context);
      onSettled?.(data, null, vars, context);
      setState({ status: 'success', error: null });
    } catch (reason) {
      const error = toError(reason);
      onError?.(error, vars, context);
      onSettled?.(undefined, error, vars, context);
      setState({ status: 'error', error });
    }
  }, []);

  return useMemo(() => ({ mutate, status: state.status, error: state.error }), [mutate, state]);
}

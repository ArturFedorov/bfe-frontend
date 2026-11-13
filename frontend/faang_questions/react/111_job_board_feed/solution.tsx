/**
 * Reference solution for 111 — keep job_feed.tsx blank for redo practice;
 * this file is for comparison after your own attempt.
 *
 * State shape (say it out loud first):
 *   ids           number[] | null     every id, newest first (fetched once)
 *   listError     string | null       `listIds` rejected
 *   shown         number              how many ids have been requested so far
 *   items         Map<id, ItemState>  loading | loaded | failed, keyed by id
 *   pagesInFlight number              > 0 while any pool is running
 * Refs: one `AbortController` per mount (unmount safety) and `requested`, the
 * per-id cache that makes "never fetch an id twice" a synchronous check.
 *
 * Order and arrival are different axes: the feed iterates `ids.slice(0, shown)`
 * and looks each id up in `items` — it never appends in resolution order.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';

export interface Job {
  id: number;
  title: string;
  by: string;
  /** Unix seconds. */
  time: number;
  url?: string;
}

export interface JobApi {
  /** Every job id, newest first. */
  listIds(): Promise<number[]>;
  getItem(id: number): Promise<Job>;
}

export interface JobFeedProps {
  api: JobApi;
  /** Ids per page. Default 6. */
  pageSize?: number;
  /** Max `getItem` calls in flight. Default 3. */
  concurrency?: number;
  /** Clock for relative times (ms). Default `Date.now`. */
  now?: () => number;
}

export interface PoolOptions<T> {
  /** Once aborted, no further task is started; in-flight tasks still settle. */
  signal?: AbortSignal;
  /** Called as each task settles, with its index in `tasks`. */
  onSettled?: (index: number, result: PromiseSettledResult<T>) => void;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Runs `tasks` with at most `limit` in flight — a worker pool, not batches:
 * the next task starts the moment any one settles. Resolves with results in
 * task order. Unstarted tasks (after abort) resolve as rejected with `signal.reason`.
 */
export function runPool<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  limit: number,
  options: PoolOptions<T> = {},
): Promise<PromiseSettledResult<T>[]> {
  const { signal, onSettled } = options;
  return new Promise((resolve) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }
    const results: PromiseSettledResult<T>[] = new Array(tasks.length);
    let next = 0; // shared cursor — every worker claims the next index from here
    let settledCount = 0;

    const settle = (index: number, result: PromiseSettledResult<T>): void => {
      results[index] = result;
      onSettled?.(index, result);
      if (++settledCount === tasks.length) resolve(results);
    };

    const worker = async (): Promise<void> => {
      while (next < tasks.length) {
        const index = next++;
        if (signal?.aborted) {
          // Abort check sits at the top of the loop: nothing new starts.
          settle(index, { status: 'rejected', reason: signal.reason ?? new Error('Aborted') });
          continue;
        }
        try {
          const value = await tasks[index]();
          settle(index, { status: 'fulfilled', value });
        } catch (reason) {
          settle(index, { status: 'rejected', reason });
        }
      }
    };

    // At least one worker (a bad `limit` degrades to sequential), never more than there are tasks.
    const workers = Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), tasks.length)) : 1;
    for (let i = 0; i < workers; i++) void worker();
  });
}

const plural = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

/** `just now` (< 60 s), `N minute(s) ago`, `N hour(s) ago`, `N day(s) ago`; future → `just now`. */
export function formatRelativeTime(timeSec: number, nowMs: number): string {
  const seconds = Math.floor(nowMs / 1000 - timeSec);
  if (seconds < 60) return 'just now'; // covers the future too
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');
  return plural(Math.floor(hours / 24), 'day');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ItemState = { status: 'loading' } | { status: 'loaded'; job: Job } | { status: 'failed' };

export function JobFeed({ api, pageSize = 6, concurrency = 3, now = Date.now }: JobFeedProps): ReactElement {
  const [ids, setIds] = useState<number[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const [items, setItems] = useState<ReadonlyMap<number, ItemState>>(() => new Map());
  const [pagesInFlight, setPagesInFlight] = useState(0);

  // Aborted on unmount: late settlements make no state updates, the pool starts nothing more.
  const abortRef = useRef<AbortController | null>(null);
  // Ids whose getItem has been started at least once — the per-id cache.
  const requestedRef = useRef(new Set<number>());

  const setItem = (id: number, state: ItemState): void => {
    setItems((prev) => new Map(prev).set(id, state));
  };

  /** Request ids `[from, from + pageSize)`, fetching only the ones never requested. */
  const loadPage = (allIds: number[], from: number, signal: AbortSignal): void => {
    const pageIds = allIds.slice(from, from + pageSize);
    setShown(from + pageIds.length);

    const toFetch = pageIds.filter((id) => !requestedRef.current.has(id));
    if (toFetch.length === 0) return;
    for (const id of toFetch) requestedRef.current.add(id);
    setItems((prev) => {
      const next = new Map(prev);
      for (const id of toFetch) next.set(id, { status: 'loading' });
      return next;
    });

    setPagesInFlight((n) => n + 1);
    void runPool(
      toFetch.map((id) => () => api.getItem(id)),
      concurrency,
      {
        signal,
        onSettled: (index, result) => {
          if (signal.aborted) return;
          setItem(toFetch[index], result.status === 'fulfilled' ? { status: 'loaded', job: result.value } : { status: 'failed' });
        },
      },
    ).then(() => {
      if (!signal.aborted) setPagesInFlight((n) => n - 1);
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    api.listIds().then(
      (list) => {
        if (signal.aborted) return;
        setIds(list);
        loadPage(list, 0, signal);
      },
      (err: unknown) => {
        if (signal.aborted) return;
        setListError(err instanceof Error ? err.message : String(err));
      },
    );

    return () => controller.abort();
    // Mount-only by contract: `listIds` is called exactly once per mounted feed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = (id: number): void => {
    const signal = abortRef.current?.signal;
    setItem(id, { status: 'loading' });
    api.getItem(id).then(
      (job) => {
        if (!signal?.aborted) setItem(id, { status: 'loaded', job });
      },
      () => {
        if (!signal?.aborted) setItem(id, { status: 'failed' });
      },
    );
  };

  const loadMore = (): void => {
    if (ids === null || abortRef.current === null) return;
    loadPage(ids, shown, abortRef.current.signal);
  };

  const loading = listError === null && (ids === null || pagesInFlight > 0);
  const total = ids?.length ?? 0;
  const statusText = listError !== null ? '' : loading ? 'Loading…' : `Showing ${shown} of ${total} jobs`;
  const hasMore = ids !== null && shown < ids.length;
  const nowMs = now();

  return (
    <section className="job-feed">
      <p role="status" className="job-feed-status">
        {statusText}
      </p>
      {listError !== null && (
        <div role="alert" className="job-feed-error">
          Could not load jobs: {listError}
        </div>
      )}

      <div role="feed" aria-label="Jobs" aria-busy={loading} className="job-feed-list">
        {(ids ?? []).slice(0, shown).map((id) => {
          const state = items.get(id);
          if (state === undefined || state.status === 'loading') return null; // skeleton would go here
          if (state.status === 'failed') {
            return (
              <div key={id} role="alert" className="job-feed-failed">
                Failed to load job {id}{' '}
                <button type="button" onClick={() => retry(id)}>
                  Retry
                </button>
              </div>
            );
          }
          const { job } = state;
          return (
            <article key={id} aria-label={job.title} className="job">
              <h3 className="job-title">
                {job.url ? <a href={job.url}>{job.title}</a> : job.title}
              </h3>
              <p className="job-meta">
                by {job.by} ·{' '}
                <time dateTime={new Date(job.time * 1000).toISOString()}>{formatRelativeTime(job.time, nowMs)}</time>
              </p>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <button type="button" onClick={loadMore} disabled={loading}>
          Load more
        </button>
      )}
    </section>
  );
}

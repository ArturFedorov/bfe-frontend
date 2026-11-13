import type { ReactElement } from 'react';

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
  throw new Error('Not implemented');
}

/** `just now` (< 60 s), `N minute(s) ago`, `N hour(s) ago`, `N day(s) ago`; future → `just now`. */
export function formatRelativeTime(timeSec: number, nowMs: number): string {
  throw new Error('Not implemented');
}

export function JobFeed(props: JobFeedProps): ReactElement {
  throw new Error('Not implemented');
}

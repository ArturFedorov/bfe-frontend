/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred, flush, type Deferred } from '../_helpers/deferred';
import { JobFeed, formatRelativeTime, runPool, type Job, type JobApi } from './job_feed';

// ---- fixtures ---------------------------------------------------------------

const NOW_MS = 1_800_000_000_000; // fixed clock for relative times
const now = () => NOW_MS;

/** 14 ids, newest first: 100, 99, …, 87. */
const IDS = Array.from({ length: 14 }, (_, i) => 100 - i);

const job = (id: number, extra: Partial<Job> = {}): Job => ({
  id,
  title: `Job ${id}`,
  by: `poster${id}`,
  time: NOW_MS / 1000 - 3600 * (101 - id), // older ids are older
  url: `https://example.com/jobs/${id}`,
  ...extra,
});

function makeApi(ids: number[] = IDS) {
  const list = deferred<number[]>();
  list.promise.catch(() => {}); // a rejected list must not crash Node when nobody awaits it
  const items = new Map<number, Deferred<Job>[]>(); // every call per id, in order
  const calls: number[] = [];
  let inFlight = 0;
  let maxInFlight = 0;

  const api: JobApi = {
    listIds: jest.fn(() => list.promise),
    getItem: jest.fn((id: number) => {
      const d = deferred<Job>();
      calls.push(id);
      items.set(id, [...(items.get(id) ?? []), d]);
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      d.promise.then(
        () => inFlight--,
        () => inFlight--,
      );
      return d.promise;
    }),
  };

  /** The latest deferred for `id`. */
  const latest = (id: number) => {
    const list = items.get(id);
    if (!list) throw new Error(`getItem(${id}) was never called`);
    return list[list.length - 1];
  };

  return {
    api,
    ids,
    list,
    calls,
    latest,
    inFlight: () => inFlight,
    maxInFlight: () => maxInFlight,
  };
}

type Api = ReturnType<typeof makeApi>;

async function settle(fn: () => void) {
  await act(async () => {
    fn();
    await flush();
    await flush();
  });
}

const resolveList = (api: Api, ids = api.ids) => settle(() => api.list.resolve(ids));
const resolveItem = (api: Api, id: number, extra?: Partial<Job>) =>
  settle(() => api.latest(id).resolve(job(id, extra)));
const rejectItem = (api: Api, id: number) => settle(() => api.latest(id).reject(new Error('boom')));

async function resolveAll(api: Api, ids: number[]) {
  for (const id of ids) await resolveItem(api, id);
}

function setup(props: Partial<React.ComponentProps<typeof JobFeed>> = {}) {
  const api = makeApi();
  const user = userEvent.setup();
  const utils = render(<JobFeed api={api.api} now={now} {...props} />);
  return { ...api, user, ...utils };
}

const feed = () => screen.getByRole('feed', { name: 'Jobs' });
const articleTitles = () => within(feed()).queryAllByRole('article').map((a) => a.getAttribute('aria-label'));
const statusEl = () => screen.getByRole('status');
const loadMore = () => screen.getByRole('button', { name: 'Load more' });

// ---- pure: runPool ----------------------------------------------------------

describe('runPool', () => {
  it('returns results in task order even when tasks settle out of order', async () => {
    const ds = [deferred<string>(), deferred<string>(), deferred<string>()];
    const p = runPool(
      ds.map((d) => () => d.promise),
      3,
    );
    ds[1].promise.catch(() => {}); // the stub never awaits it; avoid an unhandled rejection
    ds[2].resolve('c');
    ds[0].resolve('a');
    ds[1].reject(new Error('b failed'));
    const results = await p;
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected', 'fulfilled']);
    expect((results[0] as PromiseFulfilledResult<string>).value).toBe('a');
    expect((results[2] as PromiseFulfilledResult<string>).value).toBe('c');
  });

  it('never has more than `limit` tasks in flight and starts the next one when any settles', async () => {
    const ds = Array.from({ length: 5 }, () => deferred<number>());
    const started: number[] = [];
    const p = runPool(
      ds.map((d, i) => () => {
        started.push(i);
        return d.promise;
      }),
      2,
    );
    expect(started).toEqual([0, 1]);

    ds[1].resolve(1);
    await flush();
    expect(started).toEqual([0, 1, 2]);

    ds[0].resolve(0);
    await flush();
    expect(started).toEqual([0, 1, 2, 3]);

    ds[2].resolve(2);
    ds[3].resolve(3);
    await flush();
    expect(started).toEqual([0, 1, 2, 3, 4]);
    ds[4].resolve(4);
    expect((await p).every((r) => r.status === 'fulfilled')).toBe(true);
  });

  it('stops starting tasks once the signal is aborted; in-flight tasks still settle', async () => {
    const ac = new AbortController();
    const ds = Array.from({ length: 4 }, () => deferred<number>());
    const started: number[] = [];
    const p = runPool(
      ds.map((d, i) => () => {
        started.push(i);
        return d.promise;
      }),
      2,
      { signal: ac.signal },
    );
    ac.abort();
    ds[0].resolve(0);
    ds[1].resolve(1);
    const results = await p;
    expect(started).toEqual([0, 1]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[2].status).toBe('rejected');
    expect(results[3].status).toBe('rejected');
  });

  it('resolves to an empty array for no tasks', async () => {
    expect(await runPool([], 3)).toEqual([]);
  });
});

// ---- pure: formatRelativeTime -----------------------------------------------

describe('formatRelativeTime', () => {
  const sec = NOW_MS / 1000;
  it('buckets seconds, minutes, hours and days with singular/plural', () => {
    expect(formatRelativeTime(sec - 30, NOW_MS)).toBe('just now');
    expect(formatRelativeTime(sec - 60, NOW_MS)).toBe('1 minute ago');
    expect(formatRelativeTime(sec - 5 * 60, NOW_MS)).toBe('5 minutes ago');
    expect(formatRelativeTime(sec - 3600, NOW_MS)).toBe('1 hour ago');
    expect(formatRelativeTime(sec - 3 * 3600, NOW_MS)).toBe('3 hours ago');
    expect(formatRelativeTime(sec - 2 * 86400, NOW_MS)).toBe('2 days ago');
  });

  it('treats a future timestamp as just now', () => {
    expect(formatRelativeTime(sec + 500, NOW_MS)).toBe('just now');
  });
});

// ---- component: first page --------------------------------------------------

describe('JobFeed: first page', () => {
  it('calls listIds once on mount and shows Loading… until the page settles', async () => {
    const api = setup();
    expect(api.api.listIds).toHaveBeenCalledTimes(1);
    expect(statusEl()).toHaveTextContent('Loading…');
    expect(feed()).toHaveAttribute('aria-busy', 'true');

    await resolveList(api);
    expect(statusEl()).toHaveTextContent('Loading…');

    await resolveAll(api, [100, 99, 98, 97, 96, 95]);
    expect(statusEl()).toHaveTextContent('Showing 6 of 14 jobs');
    expect(feed()).toHaveAttribute('aria-busy', 'false');
    expect(api.api.listIds).toHaveBeenCalledTimes(1);
  });

  it('renders one article per job with a link title, the poster and a relative time', async () => {
    const api = setup();
    await resolveList(api);
    await resolveItem(api, 100);
    await resolveItem(api, 99, { url: undefined, title: 'Plain job' });

    const first = screen.getByRole('article', { name: 'Job 100' });
    expect(within(first).getByRole('link', { name: 'Job 100' })).toHaveAttribute(
      'href',
      'https://example.com/jobs/100',
    );
    expect(first).toHaveTextContent('poster100');
    expect(first).toHaveTextContent('1 hour ago');

    const plain = screen.getByRole('article', { name: 'Plain job' });
    expect(within(plain).queryByRole('link')).not.toBeInTheDocument();
    expect(plain).toHaveTextContent('Plain job');
    expect(plain).toHaveTextContent('2 hours ago');
  });

  it('never exceeds `concurrency` getItem calls in flight and starts the 4th when the 1st settles (senior)', async () => {
    const api = setup();
    await resolveList(api);

    expect(api.calls).toEqual([100, 99, 98]);
    expect(api.inFlight()).toBe(3);

    await resolveItem(api, 100);
    expect(api.calls).toEqual([100, 99, 98, 97]);
    expect(api.inFlight()).toBe(3);

    await resolveItem(api, 98);
    expect(api.calls).toEqual([100, 99, 98, 97, 96]);

    await resolveAll(api, [99, 97, 96, 95]);
    expect(api.calls).toHaveLength(6);
    expect(api.maxInFlight()).toBe(3);
  });

  it('respects a custom concurrency and pageSize', async () => {
    const api = setup({ concurrency: 1, pageSize: 2 });
    await resolveList(api);
    expect(api.calls).toEqual([100]);
    await resolveItem(api, 100);
    expect(api.calls).toEqual([100, 99]);
    await resolveItem(api, 99);
    expect(api.calls).toHaveLength(2);
    expect(statusEl()).toHaveTextContent('Showing 2 of 14 jobs');
  });

  it('renders items in id order regardless of resolution order (senior)', async () => {
    const api = setup();
    await resolveList(api);

    await resolveItem(api, 98); // resolves first, but belongs third
    expect(articleTitles()).toEqual(['Job 98']);

    await resolveItem(api, 99);
    expect(articleTitles()).toEqual(['Job 99', 'Job 98']);

    await resolveItem(api, 97);
    await resolveItem(api, 96);
    await resolveItem(api, 95);
    await resolveItem(api, 100); // the newest arrives last and still goes on top
    expect(articleTitles()).toEqual(['Job 100', 'Job 99', 'Job 98', 'Job 97', 'Job 96', 'Job 95']);
  });
});

// ---- component: paging ------------------------------------------------------

describe('JobFeed: Load more', () => {
  async function firstPageLoaded() {
    const api = setup();
    await resolveList(api);
    await resolveAll(api, [100, 99, 98, 97, 96, 95]);
    return api;
  }

  it('fetches the next page, is disabled while loading, and never refetches shown ids', async () => {
    const api = await firstPageLoaded();
    expect(loadMore()).toBeEnabled();

    await api.user.click(loadMore());
    expect(statusEl()).toHaveTextContent('Loading…');
    expect(loadMore()).toBeDisabled();
    expect(api.calls.slice(6)).toEqual([94, 93, 92]);

    await resolveAll(api, [94, 93, 92, 91, 90, 89]);
    expect(statusEl()).toHaveTextContent('Showing 12 of 14 jobs');
    expect(loadMore()).toBeEnabled();
    expect(articleTitles()).toHaveLength(12);
    expect(articleTitles()[6]).toBe('Job 94');
    expect(new Set(api.calls).size).toBe(api.calls.length); // no id fetched twice
    expect(api.api.listIds).toHaveBeenCalledTimes(1);
  });

  it('hides Load more once every id is shown', async () => {
    const api = await firstPageLoaded();
    await api.user.click(loadMore());
    await resolveAll(api, [94, 93, 92, 91, 90, 89]);
    await api.user.click(loadMore());
    expect(api.calls.slice(12)).toEqual([88, 87]);
    await resolveAll(api, [88, 87]);

    expect(statusEl()).toHaveTextContent('Showing 14 of 14 jobs');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(articleTitles()).toHaveLength(14);
  });

  it('shows no Load more button when the id list is empty', async () => {
    const api = setup();
    await resolveList(api, []);
    expect(statusEl()).toHaveTextContent('Showing 0 of 0 jobs');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });
});

// ---- component: failures ----------------------------------------------------

describe('JobFeed: a failed item', () => {
  it('renders an alert row with Retry for that id only, and the other items still load', async () => {
    const api = setup();
    await resolveList(api);
    await rejectItem(api, 99);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed to load job 99');
    expect(within(alert).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(api.calls).toEqual([100, 99, 98, 97]); // the pool moved on

    await resolveAll(api, [100, 98, 97, 96, 95]);
    expect(articleTitles()).toEqual(['Job 100', 'Job 98', 'Job 97', 'Job 96', 'Job 95']);
    expect(statusEl()).toHaveTextContent('Showing 6 of 14 jobs');
  });

  it('Retry refetches that single id and slots the article into its position', async () => {
    const api = setup();
    await resolveList(api);
    await rejectItem(api, 99);
    await resolveAll(api, [100, 98, 97, 96, 95]);
    const callsBefore = api.calls.length;

    await api.user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(api.calls.slice(callsBefore)).toEqual([99]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await resolveItem(api, 99);
    expect(articleTitles()).toEqual(['Job 100', 'Job 99', 'Job 98', 'Job 97', 'Job 96', 'Job 95']);
  });

  it('Retry failing again shows the alert again', async () => {
    const api = setup();
    await resolveList(api);
    await rejectItem(api, 100);
    await api.user.click(screen.getByRole('button', { name: 'Retry' }));
    await rejectItem(api, 100);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load job 100');
  });

  it('a failed listIds renders an alert and clears Loading…', async () => {
    const api = setup();
    await settle(() => api.list.reject(new Error('network down')));
    expect(screen.getByRole('alert')).toHaveTextContent('network down');
    expect(statusEl()).not.toHaveTextContent('Loading…');
    expect(api.api.getItem).not.toHaveBeenCalled();
  });
});

// ---- component: unmount -----------------------------------------------------

describe('JobFeed: unmount', () => {
  it('starts no further getItem calls and makes no state updates after unmount (senior)', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    const api = setup();
    await resolveList(api);
    expect(api.calls).toEqual([100, 99, 98]);

    api.unmount();
    await resolveAll(api, [100, 99, 98]);

    expect(api.calls).toEqual([100, 99, 98]);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('ignores a listIds that settles after unmount', async () => {
    const api = setup();
    api.unmount();
    await resolveList(api);
    expect(api.api.getItem).not.toHaveBeenCalled();
  });
});

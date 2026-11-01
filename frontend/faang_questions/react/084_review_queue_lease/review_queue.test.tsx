/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Deferred, deferred } from '../_helpers/deferred';
import { Decision, QueueApi, ReviewQueue, Task } from './review_queue';

const task = (n: number): Task => ({ id: `task-${n}`, text: `Transcript segment ${n}: "turn on the kitchen lights"`, leaseExpiresAt: 1_000_000 + n * 60_000 });

interface Mocked {
  api: QueueApi;
  next: jest.Mock<Promise<Task | null>, []>;
  renew: jest.Mock<Promise<void>, [string]>;
  submit: jest.Mock<Promise<void>, [string, Decision]>;
  /** One deferred per `next()` call, in call order. */
  nexts: Deferred<Task | null>[];
  /** One deferred per `submit()` call, in call order. */
  submits: Deferred<void>[];
}

function createApi(): Mocked {
  const nexts: Deferred<Task | null>[] = [];
  const submits: Deferred<void>[] = [];
  const next = jest.fn(() => {
    const d = deferred<Task | null>();
    nexts.push(d);
    return d.promise;
  });
  const renew = jest.fn((_id: string) => Promise.resolve());
  const submit = jest.fn((_id: string, _decision: Decision) => {
    const d = deferred<void>();
    submits.push(d);
    return d.promise;
  });
  return { api: { next, renew, submit }, next, renew, submit, nexts, submits };
}

const resolveNext = (m: Mocked, index: number, value: Task | null) =>
  act(async () => {
    m.nexts[index].resolve(value);
  });

/** Mount, resolve the first `next()` with task 1 and the prefetch with task 2 (or leave it 'pending'). */
async function mountWithTasks(m: Mocked, props: Partial<{ heartbeatMs: number }> = {}, prefetched: Task | null | 'pending' = task(2)) {
  const utils = render(<ReviewQueue api={m.api} {...props} />);
  await resolveNext(m, 0, task(1));
  if (prefetched !== 'pending') await resolveNext(m, 1, prefetched);
  return utils;
}

const click = (name: string) =>
  act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });

const press = (key: string, target: Element | Window = window) =>
  act(async () => {
    fireEvent.keyDown(target, { key });
  });

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('ReviewQueue — loading the current task', () => {
  it('calls next() once on mount and shows a loading status until it resolves', () => {
    const m = createApi();
    render(<ReviewQueue api={m.api} />);
    expect(m.next).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  });

  it('shows the task text and the four decision buttons once next() resolves', async () => {
    const m = createApi();
    render(<ReviewQueue api={m.api} />);
    await resolveNext(m, 0, task(1));

    expect(screen.getByText(task(1).text)).toBeInTheDocument();
    for (const name of ['Approve', 'Reject', 'Skip', 'Flag']) {
      expect(screen.getByRole('button', { name })).toBeEnabled();
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders "Queue empty" in a status element when next() returns null', async () => {
    const m = createApi();
    render(<ReviewQueue api={m.api} />);
    await resolveNext(m, 0, null);
    expect(screen.getByRole('status')).toHaveTextContent('Queue empty');
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(m.next).toHaveBeenCalledTimes(1); // nothing to prefetch
  });
});

describe('ReviewQueue — prefetch', () => {
  it('calls next() exactly once more as soon as a task is shown, and holds it', async () => {
    const m = createApi();
    render(<ReviewQueue api={m.api} />);
    expect(m.next).toHaveBeenCalledTimes(1);
    await resolveNext(m, 0, task(1));
    expect(m.next).toHaveBeenCalledTimes(2);

    await resolveNext(m, 1, task(2));
    // still showing task 1 — the prefetched task is held, not displayed
    expect(screen.getByText(task(1).text)).toBeInTheDocument();
    expect(screen.queryByText(task(2).text)).not.toBeInTheDocument();
    expect(m.next).toHaveBeenCalledTimes(2);
  });

  it('after a decision, shows the prefetched task and prefetches the one after it', async () => {
    const m = createApi();
    await mountWithTasks(m);
    await click('Approve');
    expect(screen.getByText(task(2).text)).toBeInTheDocument();
    expect(m.next).toHaveBeenCalledTimes(3);
  });
});

describe('ReviewQueue — heartbeat', () => {
  it('renews the lease on the shown task every heartbeatMs, not before', async () => {
    const m = createApi();
    await mountWithTasks(m, { heartbeatMs: 1000 });
    advance(999);
    expect(m.renew).not.toHaveBeenCalled();
    advance(1);
    expect(m.renew).toHaveBeenCalledTimes(1);
    expect(m.renew).toHaveBeenCalledWith('task-1');
    advance(2000);
    expect(m.renew).toHaveBeenCalledTimes(3);
  });

  it('uses 15000ms by default', async () => {
    const m = createApi();
    await mountWithTasks(m);
    advance(14_999);
    expect(m.renew).not.toHaveBeenCalled();
    advance(1);
    expect(m.renew).toHaveBeenCalledWith('task-1');
  });

  it('stops renewing on unmount', async () => {
    const m = createApi();
    const { unmount } = await mountWithTasks(m, { heartbeatMs: 1000 });
    advance(1000);
    expect(m.renew).toHaveBeenCalledTimes(1);
    unmount();
    advance(5000);
    expect(m.renew).toHaveBeenCalledTimes(1);
  });

  it('senior: after the task is replaced only the new task is renewed, on a fresh interval', async () => {
    const m = createApi();
    await mountWithTasks(m, { heartbeatMs: 1000 });
    advance(1000);
    expect(m.renew.mock.calls.map(([id]) => id)).toEqual(['task-1']);

    advance(600); // 600ms into the next interval
    await click('Skip');
    advance(400); // old interval would have fired here
    expect(m.renew.mock.calls.filter(([id]) => id === 'task-1')).toHaveLength(1);
    expect(m.renew.mock.calls.filter(([id]) => id === 'task-2')).toHaveLength(0);

    advance(600); // 1000ms after the new task was shown
    expect(m.renew.mock.calls.filter(([id]) => id === 'task-2')).toHaveLength(1);
    advance(3000);
    expect(m.renew.mock.calls.filter(([id]) => id === 'task-1')).toHaveLength(1);
  });

  it('does not renew while the queue is empty', async () => {
    const m = createApi();
    render(<ReviewQueue api={m.api} />);
    await resolveNext(m, 0, null);
    advance(60_000);
    expect(m.renew).not.toHaveBeenCalled();
  });
});

describe('ReviewQueue — decisions', () => {
  it.each<[string, Decision]>([
    ['Approve', 'approve'],
    ['Reject', 'reject'],
    ['Skip', 'skip'],
    ['Flag', 'flag'],
  ])('clicking %s submits the %s decision for the shown task', async (name, decision) => {
    const m = createApi();
    await mountWithTasks(m);
    await click(name);
    expect(m.submit).toHaveBeenCalledTimes(1);
    expect(m.submit).toHaveBeenCalledWith('task-1', decision);
  });

  it('is optimistic: the next task appears immediately while submit() is still pending', async () => {
    const m = createApi();
    await mountWithTasks(m);
    await click('Approve');
    expect(m.submits[0]).toBeDefined();
    expect(screen.getByText(task(2).text)).toBeInTheDocument();
    expect(screen.queryByText(task(1).text)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await act(async () => {
      m.submits[0].resolve();
    });
    expect(screen.getByText(task(2).text)).toBeInTheDocument();
  });

  it('shows "Queue empty" after deciding the last task when the prefetch returned null', async () => {
    const m = createApi();
    await mountWithTasks(m, {}, null);
    await click('Reject');
    expect(screen.getByRole('status')).toHaveTextContent('Queue empty');
    expect(m.submit).toHaveBeenCalledWith('task-1', 'reject');
  });

  it('senior: a decision made while the prefetch is still in flight shows loading, then the task', async () => {
    const m = createApi();
    await mountWithTasks(m, {}, 'pending'); // prefetch (nexts[1]) left pending
    await click('Approve');
    expect(m.submit).toHaveBeenCalledWith('task-1', 'approve');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
    expect(m.next).toHaveBeenCalledTimes(2); // no extra next() — the in-flight prefetch is awaited

    await resolveNext(m, 1, task(2));
    expect(screen.getByText(task(2).text)).toBeInTheDocument();
    expect(m.next).toHaveBeenCalledTimes(3); // and now the following task is prefetched
  });
});

describe('ReviewQueue — double-submit safety', () => {
  it('senior: a second decision for the same task before the first settles is ignored', async () => {
    const m = createApi();
    await mountWithTasks(m, {}, 'pending'); // prefetch pending → no next task to show yet
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
      fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
      fireEvent.keyDown(window, { key: 'f' });
    });
    expect(m.submit).toHaveBeenCalledTimes(1);
    expect(m.submit).toHaveBeenCalledWith('task-1', 'approve');

    await resolveNext(m, 1, task(2));
    await click('Reject');
    expect(m.submit).toHaveBeenCalledTimes(2);
    expect(m.submit).toHaveBeenLastCalledWith('task-2', 'reject');
  });
});

describe('ReviewQueue — submit failures', () => {
  it('explains a lease_expired rejection in an alert and keeps showing the next task', async () => {
    const m = createApi();
    await mountWithTasks(m);
    await click('Approve');
    await act(async () => {
      m.submits[0].reject(Object.assign(new Error('409'), { code: 'lease_expired' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Your lease on task task-1 expired — it was returned to the queue');
    expect(screen.getByText(task(2).text)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
  });

  it('shows the message of any other rejection, and clears it on the next decision', async () => {
    const m = createApi();
    await mountWithTasks(m);
    await click('Flag');
    await act(async () => {
      m.submits[0].reject(new Error('Network down'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');

    await resolveNext(m, 2, task(3));
    await click('Approve');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores a rejection that arrives after unmount', async () => {
    const m = createApi();
    const { unmount } = await mountWithTasks(m);
    await click('Approve');
    unmount();
    await expect(
      act(async () => {
        m.submits[0].reject(new Error('late'));
      })
    ).resolves.toBeUndefined();
  });
});

describe('ReviewQueue — hotkeys', () => {
  it.each<[string, Decision]>([
    ['a', 'approve'],
    ['R', 'reject'],
    ['s', 'skip'],
    ['F', 'flag'],
  ])('pressing %s submits %s', async (key, decision) => {
    const m = createApi();
    await mountWithTasks(m);
    await press(key);
    expect(m.submit).toHaveBeenCalledWith('task-1', decision);
  });

  it('ignores hotkeys while focus is in a text input', async () => {
    const m = createApi();
    render(<input aria-label="Reviewer note" />);
    await mountWithTasks(m);
    const note = screen.getByRole('textbox', { name: 'Reviewer note' });
    act(() => note.focus());
    await press('a', note);
    expect(m.submit).not.toHaveBeenCalled();

    act(() => note.blur());
    await press('a');
    expect(m.submit).toHaveBeenCalledWith('task-1', 'approve');
  });

  it('ignores hotkeys while loading or when the queue is empty', async () => {
    const m = createApi();
    render(<ReviewQueue api={m.api} />);
    await press('a');
    await resolveNext(m, 0, null);
    await press('a');
    expect(m.submit).not.toHaveBeenCalled();
  });

  it('removes the window listener on unmount', async () => {
    const m = createApi();
    const { unmount } = await mountWithTasks(m);
    unmount();
    await press('a');
    expect(m.submit).not.toHaveBeenCalled();
  });
});

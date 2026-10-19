/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import {
  LiveTaskFeed,
  type AnnotationTask,
  type FeedEvent,
  type FeedHandlers,
  type TaskStatus,
} from './live_task_feed';

interface MockConnection {
  since: number;
  handlers: FeedHandlers;
  close: jest.Mock;
}

function setup(props: { reconnectMs?: number; maxReconnectMs?: number } = {}) {
  const connections: MockConnection[] = [];
  const connect = jest.fn((since: number, handlers: FeedHandlers) => {
    const close = jest.fn();
    connections.push({ since, handlers, close });
    return { close };
  });
  const utils = render(
    <LiveTaskFeed connect={connect} reconnectMs={1000} maxReconnectMs={8000} {...props} />
  );
  return { connect, connections, last: () => connections[connections.length - 1], ...utils };
}

function task(id: string, title: string, status: TaskStatus, version: number): AnnotationTask {
  return { id, title, status, version };
}

function upsert(seq: number, t: AnnotationTask): FeedEvent {
  return { seq, type: 'task_upserted', task: t };
}

function removed(seq: number, taskId: string, version: number): FeedEvent {
  return { seq, type: 'task_removed', taskId, version };
}

function emit(conn: MockConnection, ...events: FeedEvent[]) {
  act(() => {
    events.forEach((e) => conn.handlers.onEvent(e));
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function itemTexts(): string[] {
  const list = screen.getByRole('list', { name: 'Tasks' });
  return within(list)
    .queryAllByRole('listitem')
    .map((li) => li.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LiveTaskFeed', () => {
  it('connects on mount with since=0 and shows Live', () => {
    const { connect, connections } = setup();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connections[0].since).toBe(0);
    expect(screen.getByRole('status')).toHaveTextContent('Live');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Tasks' })).toBeInTheDocument();
    expect(itemTexts()).toEqual([]);
  });

  it('renders one list item per task with title and status, sorted by title', () => {
    const { last } = setup();

    emit(
      last(),
      upsert(1, task('t3', 'Zebra crossing', 'queued', 1)),
      upsert(2, task('t1', 'Apple orchard', 'in_review', 1)),
      upsert(3, task('t2', 'Mango grove', 'approved', 1))
    );

    const items = within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText('Apple orchard')).toBeInTheDocument();
    expect(within(items[0]).getByText('in_review')).toBeInTheDocument();
    expect(itemTexts()).toEqual([
      'Apple orchard in_review',
      'Mango grove approved',
      'Zebra crossing queued',
    ]);
  });

  it('applies upserts by version: newer wins, stale replays are ignored', () => {
    const { last } = setup();

    emit(last(), upsert(1, task('t1', 'Apple orchard', 'queued', 1)));
    emit(last(), upsert(2, task('t1', 'Apple orchard', 'approved', 3)));
    expect(itemTexts()).toEqual(['Apple orchard approved']);

    // stale replay: lower version arriving later must not regress the task
    emit(last(), upsert(3, task('t1', 'Apple orchard', 'in_review', 2)));
    expect(itemTexts()).toEqual(['Apple orchard approved']);

    // equal version is also a no-op
    emit(last(), upsert(4, task('t1', 'Apple orchard', 'rejected', 3)));
    expect(itemTexts()).toEqual(['Apple orchard approved']);

    // a later, higher version wins
    emit(last(), upsert(5, task('t1', 'Apple orchard', 'rejected', 4)));
    expect(itemTexts()).toEqual(['Apple orchard rejected']);
  });

  it('applies a duplicated event (same seq twice) exactly once', () => {
    const { last } = setup();

    const first = upsert(1, task('t1', 'Apple orchard', 'queued', 1));
    const second = upsert(2, task('t1', 'Apple orchard', 'approved', 2));
    emit(last(), first, second);
    // server replays seq 1 and 2 again
    emit(last(), first, second);

    expect(itemTexts()).toEqual(['Apple orchard approved']);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('removes a task only when the removal version is not older than the known version', () => {
    const { last } = setup();

    emit(
      last(),
      upsert(1, task('t1', 'Apple orchard', 'queued', 2)),
      upsert(2, task('t2', 'Mango grove', 'queued', 2))
    );

    // stale removal (older version) is ignored
    emit(last(), removed(3, 't1', 1));
    expect(itemTexts()).toEqual(['Apple orchard queued', 'Mango grove queued']);

    // removal at the known version applies
    emit(last(), removed(4, 't1', 2));
    expect(itemTexts()).toEqual(['Mango grove queued']);

    // removal at a newer version applies
    emit(last(), removed(5, 't2', 5));
    expect(itemTexts()).toEqual([]);

    // a stale upsert replayed after removal must not resurrect the task
    emit(last(), upsert(6, task('t1', 'Apple orchard', 'queued', 2)));
    expect(itemTexts()).toEqual([]);
  });

  it('reconnects with exponential backoff, capped, passing since = highest applied seq', () => {
    const { connect, connections, last } = setup({ reconnectMs: 1000, maxReconnectMs: 8000 });

    emit(last(), upsert(1, task('t1', 'Apple orchard', 'queued', 1)));
    emit(last(), upsert(7, task('t2', 'Mango grove', 'queued', 1)));
    emit(last(), upsert(4, task('t3', 'Zebra crossing', 'queued', 1)));

    act(() => {
      connections[0].handlers.onClose();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Reconnecting…');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // task list survives the drop
    expect(itemTexts()).toHaveLength(3);

    // 1st reconnect after reconnectMs
    advance(999);
    expect(connect).toHaveBeenCalledTimes(1);
    advance(1);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(connections[1].since).toBe(7);
    expect(screen.getByRole('status')).toHaveTextContent('Live');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // connection drops again before delivering anything → 2x
    act(() => {
      connections[1].handlers.onClose();
    });
    advance(1999);
    expect(connect).toHaveBeenCalledTimes(2);
    advance(1);
    expect(connect).toHaveBeenCalledTimes(3);
    expect(connections[2].since).toBe(7);

    // → 4x
    act(() => {
      connections[2].handlers.onClose();
    });
    advance(3999);
    expect(connect).toHaveBeenCalledTimes(3);
    advance(1);
    expect(connect).toHaveBeenCalledTimes(4);

    // → 8x (cap)
    act(() => {
      connections[3].handlers.onClose();
    });
    advance(7999);
    expect(connect).toHaveBeenCalledTimes(4);
    advance(1);
    expect(connect).toHaveBeenCalledTimes(5);

    // still capped at maxReconnectMs
    act(() => {
      connections[4].handlers.onClose();
    });
    advance(7999);
    expect(connect).toHaveBeenCalledTimes(5);
    advance(1);
    expect(connect).toHaveBeenCalledTimes(6);
  });

  it('treats onError like a drop, and a reconnect that delivers events resets the backoff', () => {
    const { connect, connections, last } = setup({ reconnectMs: 1000, maxReconnectMs: 8000 });

    act(() => {
      connections[0].handlers.onError(new Error('socket error'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Reconnecting…');

    advance(1000);
    expect(connect).toHaveBeenCalledTimes(2);
    act(() => {
      connections[1].handlers.onError(new Error('socket error'));
    });
    advance(2000);
    expect(connect).toHaveBeenCalledTimes(3);

    // this connection is healthy: it delivers an event → alert cleared, backoff reset
    emit(last(), upsert(1, task('t1', 'Apple orchard', 'queued', 1)));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Live');

    act(() => {
      connections[2].handlers.onClose();
    });
    advance(999);
    expect(connect).toHaveBeenCalledTimes(3);
    advance(1);
    expect(connect).toHaveBeenCalledTimes(4);
    expect(connections[3].since).toBe(1);
  });

  it('ignores events and closes from a superseded connection', () => {
    const { connect, connections } = setup();

    emit(connections[0], upsert(1, task('t1', 'Apple orchard', 'queued', 1)));
    act(() => {
      connections[0].handlers.onClose();
    });
    advance(1000);
    expect(connect).toHaveBeenCalledTimes(2);

    // the old socket wakes up late: its events must not touch state
    emit(connections[0], upsert(2, task('t1', 'Apple orchard', 'approved', 2)));
    emit(connections[0], upsert(3, task('t9', 'Ghost task', 'queued', 1)));
    expect(itemTexts()).toEqual(['Apple orchard queued']);

    // ...and its second close must not schedule another reconnect
    act(() => {
      connections[0].handlers.onClose();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    advance(60000);
    expect(connect).toHaveBeenCalledTimes(2);

    // the live connection still works
    emit(connections[1], upsert(2, task('t1', 'Apple orchard', 'approved', 2)));
    expect(itemTexts()).toEqual(['Apple orchard approved']);
  });

  it('unmount closes the active connection and ignores late events', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { connect, connections, unmount } = setup();

    emit(connections[0], upsert(1, task('t1', 'Apple orchard', 'queued', 1)));
    unmount();

    expect(connections[0].close).toHaveBeenCalledTimes(1);

    // a socket that fires after unmount must not update state or reconnect
    act(() => {
      connections[0].handlers.onEvent(upsert(2, task('t2', 'Mango grove', 'queued', 1)));
      connections[0].handlers.onClose();
    });
    advance(60000);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('unmount while reconnecting cancels the pending reconnect timer', () => {
    const { connect, connections, unmount } = setup({ reconnectMs: 1000 });

    act(() => {
      connections[0].handlers.onClose();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Reconnecting…');

    unmount();
    advance(60000);
    expect(connect).toHaveBeenCalledTimes(1);
  });
});

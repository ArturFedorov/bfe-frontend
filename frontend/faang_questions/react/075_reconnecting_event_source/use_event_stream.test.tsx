/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { FakeEventSource, installFakeEventSource, restoreEventSource } from '../_helpers/fake_event_source';
import { useEventStream, type UseEventStreamOptions } from './use_event_stream';

const URL_ = '/runs/42/events';

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function setup(options: UseEventStreamOptions = {}, url: string = URL_) {
  const hook = renderHook(
    ({ u, o }: { u: string; o: UseEventStreamOptions }) => useEventStream(u, o),
    { initialProps: { u: url, o: { jitter: () => 0, ...options } } },
  );
  return { ...hook, source: () => FakeEventSource.latest, count: () => FakeEventSource.instances.length };
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

function open(es: FakeEventSource) {
  act(() => es.open());
}

function emit(es: FakeEventSource, data: string, opts?: { type?: string; lastEventId?: string }) {
  act(() => es.emit(data, opts));
}

function fail(es: FakeEventSource) {
  act(() => es.error());
}

beforeEach(() => {
  jest.useFakeTimers();
  installFakeEventSource();
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
});

afterEach(() => {
  restoreEventSource();
  delete (document as unknown as Record<string, unknown>).visibilityState;
  jest.useRealTimers();
});

describe('useEventStream', () => {
  describe('connection lifecycle', () => {
    it('constructs one EventSource with the url on mount and reports connecting', () => {
      const { result, count, source } = setup();
      expect(count()).toBe(1);
      expect(source().url).toBe(URL_);
      expect(result.current.status).toBe('connecting');
      expect(result.current.events).toEqual([]);
      expect(result.current.lastEventId).toBeNull();
    });

    it('reports open once the server accepts the connection', () => {
      const { result, source } = setup();
      open(source());
      expect(result.current.status).toBe('open');
    });

    it('appends message events with id, type and data and tracks lastEventId', () => {
      const { result, source } = setup();
      open(source());
      emit(source(), 'step fetch', { lastEventId: '1' });
      emit(source(), 'step model', { lastEventId: '2' });
      expect(result.current.events).toEqual([
        { id: '1', type: 'message', data: 'step fetch' },
        { id: '2', type: 'message', data: 'step model' },
      ]);
      expect(result.current.lastEventId).toBe('2');
    });

    it('stores a null id for events without lastEventId and leaves lastEventId unchanged', () => {
      const { result, source } = setup();
      open(source());
      emit(source(), 'a', { lastEventId: '5' });
      emit(source(), 'heartbeat');
      expect(result.current.events[1]).toEqual({ id: null, type: 'message', data: 'heartbeat' });
      expect(result.current.lastEventId).toBe('5');
    });

    it('subscribes to named event types listed in options.eventTypes', () => {
      const { result, source } = setup({ eventTypes: ['step'] });
      open(source());
      emit(source(), '{"name":"validate"}', { type: 'step', lastEventId: '3' });
      emit(source(), 'ignored', { type: 'other' });
      expect(result.current.events).toEqual([{ id: '3', type: 'step', data: '{"name":"validate"}' }]);
    });
  });

  describe('reconnect with backoff', () => {
    it('closes the failed source, reports reconnecting and reconnects after baseMs', () => {
      const { result, source, count } = setup({ baseMs: 1000 });
      const first = source();
      open(first);
      fail(first);

      expect(first.readyState).toBe(FakeEventSource.CLOSED);
      expect(result.current.status).toBe('reconnecting');
      advance(999);
      expect(count()).toBe(1);
      advance(1);
      expect(count()).toBe(2);
      expect(result.current.status).toBe('connecting');
    });

    it('doubles the delay on consecutive failures and caps it at maxMs', () => {
      const { source, count } = setup({ baseMs: 1000, maxMs: 5000 });
      open(source());

      const expected = [1000, 2000, 4000, 5000, 5000];
      expected.forEach((delay, i) => {
        fail(source());
        advance(delay - 1);
        expect(count()).toBe(i + 1);
        advance(1);
        expect(count()).toBe(i + 2);
      });
    });

    it('adds jitter() * baseMs to the delay', () => {
      const { source, count } = setup({ baseMs: 1000, jitter: () => 0.5 });
      open(source());
      fail(source());
      advance(1499);
      expect(count()).toBe(1);
      advance(1);
      expect(count()).toBe(2);
    });

    it('resets the backoff after a successful open', () => {
      const { source, count } = setup({ baseMs: 1000 });
      open(source());
      fail(source());
      advance(1000);
      fail(source());
      advance(2000);
      expect(count()).toBe(3);

      open(source());
      fail(source());
      advance(999);
      expect(count()).toBe(3);
      advance(1);
      expect(count()).toBe(4);
    });

    it('carries lastEventId as a query parameter on reconnect but not on the first connection', () => {
      const { source } = setup({ baseMs: 1000 });
      expect(source().url).toBe(URL_);
      open(source());
      emit(source(), 'a', { lastEventId: '7' });
      fail(source());
      advance(1000);
      expect(source().url).toBe(`${URL_}?lastEventId=7`);
    });

    it('appends lastEventId with & when the url already has a query string', () => {
      const { source } = setup({ baseMs: 1000 }, '/events?run=42');
      open(source());
      emit(source(), 'a', { lastEventId: 'ev 9' });
      fail(source());
      advance(1000);
      expect(source().url).toBe('/events?run=42&lastEventId=ev%209');
    });

    it('does not carry a parameter when no event with an id has been seen', () => {
      const { source } = setup({ baseMs: 1000 });
      open(source());
      emit(source(), 'no id');
      fail(source());
      advance(1000);
      expect(source().url).toBe(URL_);
    });
  });

  describe('dedupe by event id', () => {
    it('drops an event whose id was already seen when the server replays after reconnect', () => {
      const { result, source } = setup({ baseMs: 1000 });
      open(source());
      emit(source(), 'a', { lastEventId: '1' });
      emit(source(), 'b', { lastEventId: '2' });
      fail(source());
      advance(1000);
      open(source());
      emit(source(), 'b', { lastEventId: '2' });
      emit(source(), 'c', { lastEventId: '3' });

      expect(result.current.events.map((e) => e.data)).toEqual(['a', 'b', 'c']);
      expect(result.current.lastEventId).toBe('3');
    });

    it('never dedupes events that have no id', () => {
      const { result, source } = setup();
      open(source());
      emit(source(), 'tick');
      emit(source(), 'tick');
      expect(result.current.events).toHaveLength(2);
    });
  });

  describe('superseded sources are inert', () => {
    it('ignores late message events from a source the hook has already replaced', () => {
      const { result, source } = setup({ baseMs: 1000 });
      const old = source();
      open(old);
      fail(old);
      advance(1000);
      const fresh = source();
      expect(fresh).not.toBe(old);

      // a zombie connection that comes back to life must not reach the hook
      old.readyState = FakeEventSource.OPEN;
      emit(old, 'ghost', { lastEventId: '99' });

      expect(result.current.events).toEqual([]);
      expect(result.current.lastEventId).toBeNull();
    });

    it('does not schedule another reconnect when a superseded source errors again', () => {
      const { source, count } = setup({ baseMs: 1000 });
      const old = source();
      open(old);
      fail(old);
      advance(1000);
      expect(count()).toBe(2);

      fail(old);
      advance(60_000);
      expect(count()).toBe(2);
    });
  });

  describe('page visibility', () => {
    it('does not reconnect while the tab is hidden and reconnects immediately when visible', () => {
      const { result, source, count } = setup({ baseMs: 1000 });
      open(source());
      emit(source(), 'a', { lastEventId: '4' });
      visibility = 'hidden';
      fail(source());

      expect(result.current.status).toBe('reconnecting');
      advance(60_000);
      expect(count()).toBe(1);

      setVisibility('visible');
      expect(count()).toBe(2);
      expect(result.current.status).toBe('connecting');
      expect(source().url).toBe(`${URL_}?lastEventId=4`);
    });

    it('cancels a pending reconnect when the tab hides and reconnects when it is visible again', () => {
      const { source, count } = setup({ baseMs: 1000 });
      open(source());
      fail(source());
      advance(500);
      setVisibility('hidden');
      advance(60_000);
      expect(count()).toBe(1);

      setVisibility('visible');
      expect(count()).toBe(2);
    });

    it('keeps an open connection alive when the tab hides', () => {
      const { result, source, count } = setup();
      open(source());
      setVisibility('hidden');
      expect(source().readyState).toBe(FakeEventSource.OPEN);
      expect(result.current.status).toBe('open');
      expect(count()).toBe(1);
    });
  });

  describe('close and unmount', () => {
    it('close() closes the source, reports closed and cancels a pending reconnect', () => {
      const { result, source, count } = setup({ baseMs: 1000 });
      open(source());
      fail(source());
      act(() => result.current.close());

      expect(result.current.status).toBe('closed');
      advance(60_000);
      expect(count()).toBe(1);
      setVisibility('visible');
      expect(count()).toBe(1);
    });

    it('close() on an open connection closes it and ignores later events', () => {
      const { result, source } = setup();
      const es = source();
      open(es);
      act(() => result.current.close());
      expect(es.readyState).toBe(FakeEventSource.CLOSED);
      es.readyState = FakeEventSource.OPEN;
      emit(es, 'late', { lastEventId: '1' });
      expect(result.current.events).toEqual([]);
      expect(result.current.status).toBe('closed');
    });

    it('keeps a stable close identity across renders', () => {
      const { result, rerender, source } = setup();
      const before = result.current.close;
      open(source());
      rerender({ u: URL_, o: { jitter: () => 0 } });
      expect(result.current.close).toBe(before);
    });

    it('unmount during the reconnect wait makes no new connection', () => {
      const { source, count, unmount } = setup({ baseMs: 1000 });
      open(source());
      fail(source());
      unmount();
      advance(60_000);
      expect(count()).toBe(1);
    });

    it('unmount closes an open source', () => {
      const { source, unmount } = setup();
      const es = source();
      open(es);
      unmount();
      expect(es.readyState).toBe(FakeEventSource.CLOSED);
    });
  });
});

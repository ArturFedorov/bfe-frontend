/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { InfinitePartnerFeed, EventsPage } from './infinite_partner_feed';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  elements = new Set<Element>();
  disconnected = false;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(isIntersecting = true) {
    const entries = [...this.elements].map(
      (target) => ({ target, isIntersecting } as IntersectionObserverEntry)
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

function lastObserver() {
  const { instances } = MockIntersectionObserver;
  expect(instances.length).toBeGreaterThan(0);
  return instances[instances.length - 1];
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  (globalThis as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
});

function setup() {
  const calls: Array<ReturnType<typeof deferred<EventsPage>>> = [];
  const fetchEvents = jest.fn((_page: number) => {
    const d = deferred<EventsPage>();
    calls.push(d);
    return d.promise;
  });
  render(<InfinitePartnerFeed fetchEvents={fetchEvents} />);
  return { calls, fetchEvents };
}

describe('InfinitePartnerFeed', () => {
  it('loads page 1 on mount and renders events in an accessible feed', async () => {
    const { calls, fetchEvents } = setup();

    expect(fetchEvents).toHaveBeenCalledTimes(1);
    expect(fetchEvents).toHaveBeenCalledWith(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading events…');
    expect(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      calls[0].resolve({
        events: [
          { id: 'e1', message: 'Asset received from Acme' },
          { id: 'e2', message: 'Validation failed for Nordic Films' },
        ],
        hasMore: true,
      });
    });

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(2);
    expect(articles[0]).toHaveTextContent('Asset received from Acme');
    expect(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('appends the next page when the sentinel intersects', async () => {
    const { calls, fetchEvents } = setup();
    await act(async () => {
      calls[0].resolve({
        events: [{ id: 'e1', message: 'Asset received from Acme' }],
        hasMore: true,
      });
    });

    act(() => lastObserver().trigger());

    expect(fetchEvents).toHaveBeenCalledTimes(2);
    expect(fetchEvents).toHaveBeenLastCalledWith(2);

    await act(async () => {
      calls[1].resolve({
        events: [{ id: 'e2', message: 'Delivery confirmed for Acme' }],
        hasMore: true,
      });
    });

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(2);
    expect(articles[0]).toHaveTextContent('Asset received from Acme');
    expect(articles[1]).toHaveTextContent('Delivery confirmed for Acme');
  });

  it('does not fetch a duplicate page while a request is in flight', async () => {
    const { calls, fetchEvents } = setup();
    await act(async () => {
      calls[0].resolve({
        events: [{ id: 'e1', message: 'Asset received from Acme' }],
        hasMore: true,
      });
    });

    act(() => lastObserver().trigger());
    act(() => lastObserver().trigger());
    act(() => lastObserver().trigger());

    expect(fetchEvents).toHaveBeenCalledTimes(2);
    expect(fetchEvents).toHaveBeenLastCalledWith(2);

    await act(async () => {
      calls[1].resolve({
        events: [{ id: 'e2', message: 'Delivery confirmed for Acme' }],
        hasMore: true,
      });
    });

    act(() => lastObserver().trigger());
    expect(fetchEvents).toHaveBeenCalledTimes(3);
    expect(fetchEvents).toHaveBeenLastCalledWith(3);
  });

  it('shows the end state and stops observing when hasMore is false', async () => {
    const { calls, fetchEvents } = setup();
    await act(async () => {
      calls[0].resolve({
        events: [{ id: 'e1', message: 'Asset received from Acme' }],
        hasMore: true,
      });
    });

    const observer = lastObserver();
    act(() => observer.trigger());
    await act(async () => {
      calls[1].resolve({
        events: [{ id: 'e2', message: 'Delivery confirmed for Acme' }],
        hasMore: false,
      });
    });

    expect(screen.getByText('No more events')).toBeInTheDocument();
    expect(observer.disconnected).toBe(true);

    act(() => observer.trigger());
    expect(fetchEvents).toHaveBeenCalledTimes(2);
    // both pages remain rendered
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});

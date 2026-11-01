/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { startTransition } from 'react';
import { renderToString } from 'react-dom/server.node';
import { act, render, screen } from '@testing-library/react';
import { createStore, shallowEqual, Store, useStore } from './mini_store';

type ReviewState = {
  selectedTaskId: string | null;
  labelCount: number;
  filters: { status: 'all' | 'pending' | 'approved'; query: string };
  start: number;
  end: number;
};

const initial: ReviewState = {
  selectedTaskId: null,
  labelCount: 0,
  filters: { status: 'all', query: '' },
  start: 0,
  end: 0,
};

type Probe = (id: string) => void;

function SelectedTask({ store, onRender }: { store: Store<ReviewState>; onRender?: Probe }) {
  onRender?.('selected');
  const id = useStore(store, (s) => s.selectedTaskId);
  return <p>Selected: {id ?? 'none'}</p>;
}

function LabelCount({ store, onRender }: { store: Store<ReviewState>; onRender?: Probe }) {
  onRender?.('count');
  const n = useStore(store, (s) => s.labelCount);
  return <p>Labels: {n}</p>;
}

function FilterSummary({ store, onRender }: { store: Store<ReviewState>; onRender?: Probe }) {
  onRender?.('filters');
  // Object slice built fresh on every selector call → needs a custom equality function.
  const slice = useStore(
    store,
    (s) => ({ status: s.filters.status, labels: s.labelCount }),
    shallowEqual
  );
  return (
    <p>
      Filters: {slice.status} / {slice.labels}
    </p>
  );
}

function Scaled({
  store,
  factor,
  onRender,
}: {
  store: Store<ReviewState>;
  factor: number;
  onRender?: Probe;
}) {
  onRender?.('scaled');
  const scaled = useStore(store, (s) => s.labelCount * factor);
  return <p>Scaled: {scaled}</p>;
}

function Range({ store, onPair }: { store: Store<ReviewState>; onPair: (pair: string) => void }) {
  const pair = useStore(store, (s) => ({ start: s.start, end: s.end }), shallowEqual);
  onPair(`${pair.start}:${pair.end}`);
  return (
    <p>
      Range: {pair.start}-{pair.end}
    </p>
  );
}

function rendersOf(probe: jest.Mock, id: string): number {
  return probe.mock.calls.filter((c) => c[0] === id).length;
}

describe('090 mini store — getState / setState', () => {
  it('getState returns the initial state object', () => {
    const store = createStore(initial);
    expect(store.getState()).toBe(initial);
  });

  it('setState with a partial shallow-merges and replaces (not deep-merges) nested objects', () => {
    const store = createStore(initial);
    store.setState({ labelCount: 3 });
    expect(store.getState()).toEqual({ ...initial, labelCount: 3 });

    store.setState({ filters: { status: 'pending', query: '' } });
    expect(store.getState().filters).toEqual({ status: 'pending', query: '' });
    expect(store.getState().labelCount).toBe(3);
  });

  it('setState with a function receives the current state', () => {
    const store = createStore(initial);
    store.setState({ labelCount: 5 });
    store.setState((s) => ({ labelCount: s.labelCount + 1 }));
    expect(store.getState().labelCount).toBe(6);
  });

  it('does not mutate the previous state object', () => {
    const store = createStore(initial);
    const before = store.getState();
    store.setState({ labelCount: 9 });
    expect(before.labelCount).toBe(0);
    expect(store.getState()).not.toBe(before);
  });
});

describe('090 mini store — subscribe / notify', () => {
  it('notifies every subscriber synchronously, exactly once per setState', () => {
    const store = createStore(initial);
    const a = jest.fn();
    const b = jest.fn();
    store.subscribe(a);
    store.subscribe(b);

    store.setState({ labelCount: 1 });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    store.setState((s) => ({ labelCount: s.labelCount + 1 }));
    expect(a).toHaveBeenCalledTimes(2);
  });

  it('the listener observes the new state when it runs', () => {
    const store = createStore(initial);
    const seen: number[] = [];
    store.subscribe(() => seen.push(store.getState().labelCount));
    store.setState({ labelCount: 7 });
    expect(seen).toEqual([7]);
  });

  it('unsubscribe stops notifications and listenerCount tracks subscribers', () => {
    const store = createStore(initial);
    const a = jest.fn();
    const unsubscribe = store.subscribe(a);
    expect(store.listenerCount()).toBe(1);

    unsubscribe();
    unsubscribe(); // idempotent
    expect(store.listenerCount()).toBe(0);

    store.setState({ labelCount: 1 });
    expect(a).not.toHaveBeenCalled();
  });

  it('a listener that unsubscribes during notification does not break the others', () => {
    const store = createStore(initial);
    const b = jest.fn();
    const unsubA = store.subscribe(() => unsubA());
    store.subscribe(b);
    store.setState({ labelCount: 1 });
    expect(b).toHaveBeenCalledTimes(1);
    expect(store.listenerCount()).toBe(1);
  });
});

describe('090 mini store — batch', () => {
  it('three setStates inside one batch notify once, after the batch body finishes', () => {
    const store = createStore(initial);
    const listener = jest.fn();
    store.subscribe(listener);

    store.batch(() => {
      store.setState({ labelCount: 1 });
      store.setState({ selectedTaskId: 't-1' });
      store.setState({ start: 2 });
      expect(listener).not.toHaveBeenCalled();
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({ labelCount: 1, selectedTaskId: 't-1', start: 2 });
  });

  it('getState inside a batch already reflects earlier setStates in that batch', () => {
    const store = createStore(initial);
    store.batch(() => {
      store.setState({ labelCount: 2 });
      expect(store.getState().labelCount).toBe(2);
      store.setState((s) => ({ labelCount: s.labelCount * 10 }));
    });
    expect(store.getState().labelCount).toBe(20);
  });

  it('nested batches notify once when the outermost batch ends', () => {
    const store = createStore(initial);
    const listener = jest.fn();
    store.subscribe(listener);

    store.batch(() => {
      store.setState({ labelCount: 1 });
      store.batch(() => {
        store.setState({ labelCount: 2 });
      });
      expect(listener).not.toHaveBeenCalled();
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('a batch with no setState does not notify', () => {
    const store = createStore(initial);
    const listener = jest.fn();
    store.subscribe(listener);
    store.batch(() => {});
    expect(listener).not.toHaveBeenCalled();
  });

  it('senior: a batch whose body throws still flushes the notification and leaves the store usable', () => {
    const store = createStore(initial);
    const listener = jest.fn();
    store.subscribe(listener);

    expect(() =>
      store.batch(() => {
        store.setState({ labelCount: 4 });
        throw new Error('boom');
      })
    ).toThrow('boom');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().labelCount).toBe(4);

    // Depth counter was reset: plain setState notifies synchronously again.
    store.setState({ labelCount: 5 });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('090 mini store — shallowEqual', () => {
  it('compares primitives with Object.is', () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual('a', 'b')).toBe(false);
    expect(shallowEqual(NaN, NaN)).toBe(true);
    expect(shallowEqual(null, undefined)).toBe(false);
  });

  it('compares one level of own keys', () => {
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: { n: 1 } }, { a: { n: 1 } })).toBe(false); // nested by reference
    expect(shallowEqual([1, 2], [1, 2])).toBe(true);
  });
});

describe('090 mini store — useStore renders the selected slice', () => {
  it('renders the current slice and updates when it changes', () => {
    const store = createStore(initial);
    render(<SelectedTask store={store} />);
    expect(screen.getByText('Selected: none')).toBeVisible();

    act(() => store.setState({ selectedTaskId: 't-4' }));
    expect(screen.getByText('Selected: t-4')).toBeVisible();
  });

  it('subscribes on mount and unsubscribes on unmount', () => {
    const store = createStore(initial);
    const { unmount } = render(
      <>
        <SelectedTask store={store} />
        <LabelCount store={store} />
      </>
    );
    expect(store.listenerCount()).toBe(2);
    unmount();
    expect(store.listenerCount()).toBe(0);
  });

  it('senior: updating one slice re-renders only the component that selects it', () => {
    const store = createStore(initial);
    const probe = jest.fn();
    render(
      <>
        <SelectedTask store={store} onRender={probe} />
        <LabelCount store={store} onRender={probe} />
      </>
    );
    probe.mockClear();

    act(() => store.setState({ labelCount: 1 }));
    expect(rendersOf(probe, 'count')).toBe(1);
    expect(rendersOf(probe, 'selected')).toBe(0);

    act(() => store.setState({ selectedTaskId: 't-2' }));
    expect(rendersOf(probe, 'selected')).toBe(1);
    expect(rendersOf(probe, 'count')).toBe(1);

    // Same value written again → slice unchanged (Object.is) → no render.
    act(() => store.setState({ labelCount: 1 }));
    expect(rendersOf(probe, 'count')).toBe(1);
  });

  it('senior: a batch of three setStates re-renders a subscribed component once', () => {
    const store = createStore(initial);
    const probe = jest.fn();
    render(<LabelCount store={store} onRender={probe} />);
    probe.mockClear();

    act(() => store.setState({ labelCount: 1 }));
    act(() => store.setState({ labelCount: 2 }));
    act(() => store.setState({ labelCount: 3 }));
    expect(rendersOf(probe, 'count')).toBe(3);
    probe.mockClear();

    act(() =>
      store.batch(() => {
        store.setState({ labelCount: 4 });
        store.setState({ labelCount: 5 });
        store.setState({ labelCount: 6 });
      })
    );
    expect(rendersOf(probe, 'count')).toBe(1);
    expect(screen.getByText('Labels: 6')).toBeVisible();
  });

  it('custom equality: an object slice does not re-render on unrelated updates', () => {
    const store = createStore(initial);
    const probe = jest.fn();
    render(<FilterSummary store={store} onRender={probe} />);
    probe.mockClear();

    act(() => store.setState({ selectedTaskId: 't-9', start: 3 }));
    expect(rendersOf(probe, 'filters')).toBe(0);

    act(() => store.setState({ filters: { status: 'pending', query: 'x' } }));
    expect(rendersOf(probe, 'filters')).toBe(1);
    expect(screen.getByText('Filters: pending / 0')).toBeVisible();

    act(() => store.setState({ filters: { status: 'pending', query: 'changed-only-query' } }));
    expect(rendersOf(probe, 'filters')).toBe(1); // slice is shallow-equal → skipped
  });

  it('senior: a changed selector (via props) yields the new slice without a store update', () => {
    const store = createStore({ ...initial, labelCount: 3 });
    const { rerender } = render(<Scaled store={store} factor={1} />);
    expect(screen.getByText('Scaled: 3')).toBeVisible();

    rerender(<Scaled store={store} factor={2} />);
    expect(screen.getByText('Scaled: 6')).toBeVisible();

    act(() => store.setState({ labelCount: 4 }));
    expect(screen.getByText('Scaled: 8')).toBeVisible();
  });

  it('senior: no tearing — a two-field slice never renders a half-updated pair', () => {
    const store = createStore(initial);
    const pairs: string[] = [];
    render(<Range store={store} onPair={(p) => pairs.push(p)} />);

    for (let i = 1; i <= 25; i += 1) {
      act(() => store.setState({ start: i, end: i }));
      act(() => startTransition(() => store.setState({ start: i + 100, end: i + 100 })));
    }
    act(() =>
      store.batch(() => {
        store.setState({ start: 500 });
        store.setState({ end: 500 });
      })
    );

    expect(pairs.length).toBeGreaterThan(25);
    for (const p of pairs) {
      const [start, end] = p.split(':');
      expect(start).toBe(end);
    }
    expect(screen.getByText('Range: 500-500')).toBeVisible();
  });
});

describe('090 mini store — server snapshot and implementation constraints', () => {
  it('renders on the server via getServerSnapshot (renderToString does not throw)', () => {
    const store = createStore({ ...initial, labelCount: 3 });
    const html = renderToString(<LabelCount store={store} />);
    expect(html).toContain('Labels: ');
    expect(html).toContain('3');
  });

  it('is built on useSyncExternalStore, not a useEffect/useState subscription', () => {
    const source = readFileSync(join(__dirname, 'mini_store.ts'), 'utf8');
    expect(source).toMatch(/useSyncExternalStore/);
    expect(source).not.toMatch(/useEffect\s*\(/);
    expect(source).not.toMatch(/useState\s*\(/);
  });
});

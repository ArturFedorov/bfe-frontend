/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { createStore, useStore } from './store';

interface State {
  count: number;
  label: string;
  items: string[];
}

function makeStore() {
  return createStore<State>({ count: 0, label: 'a', items: [] });
}

describe('shell/store — createStore', () => {
  it('getState / setState with a partial and with an updater', () => {
    const store = makeStore();
    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1, label: 'a', items: [] });
    store.setState((s) => ({ count: s.count + 1 }));
    expect(store.getState().count).toBe(2);
  });

  it('notifies subscribers with (state, previous) and skips no-op updates', () => {
    const store = makeStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].count).toBe(1);
    expect(listener.mock.calls[0][1].count).toBe(0);

    store.setState({ count: 1 }); // same value — no notification
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setState({ count: 5 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('batch coalesces several sets into one notification (and nests)', () => {
    const store = makeStore();
    const listener = jest.fn();
    store.subscribe(listener);

    store.batch(() => {
      store.setState({ count: 1 });
      store.batch(() => {
        store.setState({ label: 'b' });
      });
      store.setState({ count: 2 });
      expect(listener).not.toHaveBeenCalled();
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const [state, previous] = listener.mock.calls[0];
    expect(state).toEqual({ count: 2, label: 'b', items: [] });
    expect(previous).toEqual({ count: 0, label: 'a', items: [] });
  });

  it('a batch with no changes notifies nobody', () => {
    const store = makeStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.batch(() => {
      store.setState({ count: 0 });
    });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('shell/store — useStore', () => {
  function Counter({
    store,
    renders,
  }: {
    store: ReturnType<typeof makeStore>;
    renders: { n: number };
  }) {
    const count = useStore(store, (s) => s.count);
    renders.n += 1;
    return <output data-testid="count">{count}</output>;
  }

  function Label({
    store,
    renders,
  }: {
    store: ReturnType<typeof makeStore>;
    renders: { n: number };
  }) {
    const label = useStore(store, (s) => s.label);
    renders.n += 1;
    return <output data-testid="label">{label}</output>;
  }

  it('renders the selected slice and updates when it changes', () => {
    const store = makeStore();
    const renders = { n: 0 };
    render(<Counter store={store} renders={renders} />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    act(() => store.setState({ count: 3 }));
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });

  it('selector isolation: a component only re-renders when its slice changes', () => {
    const store = makeStore();
    const counterRenders = { n: 0 };
    const labelRenders = { n: 0 };
    render(
      <>
        <Counter store={store} renders={counterRenders} />
        <Label store={store} renders={labelRenders} />
      </>,
    );
    const c0 = counterRenders.n;
    const l0 = labelRenders.n;

    act(() => store.setState({ label: 'z' }));
    expect(screen.getByTestId('label')).toHaveTextContent('z');
    expect(labelRenders.n).toBeGreaterThan(l0);
    expect(counterRenders.n).toBe(c0);

    act(() => store.setState({ count: 9 }));
    expect(counterRenders.n).toBeGreaterThan(c0);
  });

  it('batching produces a single render for several sets', () => {
    const store = makeStore();
    const renders = { n: 0 };
    render(<Counter store={store} renders={renders} />);
    const before = renders.n;
    act(() => {
      store.batch(() => {
        store.setState({ count: 1 });
        store.setState({ count: 2 });
        store.setState({ count: 3 });
      });
    });
    expect(screen.getByTestId('count')).toHaveTextContent('3');
    expect(renders.n - before).toBe(1);
  });

  it('a custom equalityFn suppresses renders for structurally equal selections', () => {
    const store = makeStore();
    const renders = { n: 0 };
    const shallowArray = (a: string[], b: string[]) =>
      a.length === b.length && a.every((x, i) => x === b[i]);

    function Items() {
      const items = useStore(
        store,
        (s) => s.items.filter((i) => i.startsWith('a')),
        shallowArray,
      );
      renders.n += 1;
      return <output data-testid="items">{items.join(',')}</output>;
    }

    render(<Items />);
    act(() => store.setState({ items: ['apple', 'banana'] }));
    expect(screen.getByTestId('items')).toHaveTextContent('apple');
    const before = renders.n;
    act(() => store.setState({ items: ['apple', 'cherry'] })); // derived slice unchanged
    expect(renders.n).toBe(before);
    act(() => store.setState({ items: ['apple', 'avocado'] }));
    expect(renders.n).toBe(before + 1);
    expect(screen.getByTestId('items')).toHaveTextContent('apple,avocado');
  });
});

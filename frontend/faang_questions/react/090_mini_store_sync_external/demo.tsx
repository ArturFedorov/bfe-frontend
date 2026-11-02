import { useRef } from 'react';
import { createStore, shallowEqual, useStore } from './mini_store';

/**
 * Demo harness for the useSyncExternalStore mini store — auto-discovered by
 * the playground (playground/App.tsx). One module-level store feeds three
 * sibling panels, each subscribed through `useStore` with a different
 * selector. Every panel shows its own render count, so you can see that a
 * write to `count` leaves the label and items panels untouched, and that a
 * `batch` of three writes re-renders each affected panel once.
 *
 * Render counts come from a ref bumped during render (no effects), so the
 * readout measures exactly the renders the store caused. StrictMode doubles
 * dev counts — watch the deltas, not the absolute numbers.
 */
type DemoState = { count: number; label: string; items: string[] };

const INITIAL: DemoState = { count: 0, label: 'idle', items: [] };
const LABELS = ['idle', 'busy', 'review', 'done'] as const;

const store = createStore<DemoState>({ count: 0, label: 'idle', items: [] as string[] });

/** Displays a slice plus how many times its parent panel has rendered. */
function RenderCounter({ title, value }: { title: string; value: string }) {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem', flex: 1 }}>
      <strong>{title}</strong>
      <div>
        value: <code>{value}</code>
      </div>
      <div>renders: {renders.current}</div>
    </div>
  );
}

function CountPanel() {
  const count = useStore(store, (s) => s.count);
  return <RenderCounter title="count" value={String(count)} />;
}

function LabelPanel() {
  const label = useStore(store, (s) => s.label);
  return <RenderCounter title="label" value={label} />;
}

function ItemsPanel() {
  // Object slice: only re-renders when size or last item changes, thanks to shallowEqual.
  const slice = useStore(
    store,
    (s) => ({ size: s.items.length, last: s.items[s.items.length - 1] ?? '—' }),
    shallowEqual,
  );
  return <RenderCounter title="items (shallowEqual)" value={`${slice.size} · last ${slice.last}`} />;
}

function nextLabel(current: string): string {
  const i = (LABELS as readonly string[]).indexOf(current);
  return LABELS[(i + 1) % LABELS.length];
}

function addItem(s: DemoState): Partial<DemoState> {
  return { items: [...s.items, `item-${s.items.length + 1}`] };
}

export default function Demo() {
  const increment = () => store.setState((s) => ({ count: s.count + 1 }));
  const changeLabel = () => store.setState((s) => ({ label: nextLabel(s.label) }));
  const add = () => store.setState(addItem);
  const batch = () =>
    store.batch(() => {
      increment();
      changeLabel();
      add();
    });
  const reset = () => store.setState(INITIAL);

  return (
    <div className="demo">
      <h2>Mini Store (useSyncExternalStore)</h2>
      <p className="demo-note">
        Implement <code>createStore</code>, <code>shallowEqual</code> and <code>useStore</code>{' '}
        in <code>mini_store.ts</code>. Three sibling panels each select a different slice of one
        shared store. Click &quot;Increment count&quot;: only the count panel&apos;s render counter
        moves. &quot;Add item&quot; bumps only the items panel (an object slice kept stable by{' '}
        <code>shallowEqual</code>). &quot;Batch&quot; writes all three fields in one{' '}
        <code>store.batch</code> and each panel renders once, not once per write. Before the
        fix the panels throw &quot;Not implemented&quot;; a naive implementation re-renders
        every panel on every write.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={increment}>Increment count</button>
          <button onClick={changeLabel}>Change label</button>
          <button onClick={add}>Add item</button>
          <button onClick={batch}>Batch (all three)</button>
          <button onClick={reset}>Reset</button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <CountPanel />
          <LabelPanel />
          <ItemsPanel />
        </div>
      </div>
    </div>
  );
}

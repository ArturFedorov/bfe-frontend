import { memo, useState, type ReactNode } from 'react';

// This lab ships COMPLETE. Your job is not to change the code — it is to
// predict the render counts in the README before running the tests, then
// explain every count in the answers section.
//
// Render-count convention (used across Topic 6): every component accepts an
// optional `onRender?: (id: string) => void` prop and calls it at the top of
// its function body. Tests pass a jest.fn() and count calls per id.

type Probe = {
  onRender?: (id: string) => void;
};

function Title({ onRender }: Probe) {
  onRender?.('title');
  return <h1>Render counter lab</h1>;
}

const MemoTitle = memo(function MemoTitle({ onRender }: Probe) {
  onRender?.('memo-title');
  return <h2>Memoized title</h2>;
});

function Stable({ onRender }: Probe) {
  onRender?.('stable');
  return <p>Stable child (passed as children)</p>;
}

function Leaf({ onRender }: Probe) {
  onRender?.('leaf');
  return <p>Leaf</p>;
}

function Panel({ onRender, children }: Probe & { children?: ReactNode }) {
  onRender?.('panel');
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen((o) => !o)}>Toggle panel</button>
      <p>Panel is {open ? 'open' : 'closed'}</p>
      {children}
      <Leaf onRender={onRender} />
    </section>
  );
}

export function RenderCounterLab({ onRender }: Probe) {
  onRender?.('app');
  const [count, setCount] = useState(0);
  return (
    <main>
      <button onClick={() => setCount((c) => c + 1)}>
        Increment app ({count})
      </button>
      <Title onRender={onRender} />
      <MemoTitle onRender={onRender} />
      <Panel onRender={onRender}>
        <Stable onRender={onRender} />
      </Panel>
    </main>
  );
}

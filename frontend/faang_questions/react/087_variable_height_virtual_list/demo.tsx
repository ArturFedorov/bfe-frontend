import { useEffect, useRef, useState } from 'react';
import { VirtualList, type VirtualListHandle } from './virtual_list';

/**
 * Demo harness for VirtualList — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is virtual_list.test.tsx.
 */

interface Entry {
  id: string;
  /** 1–6 sentences; the row's rendered height depends on this. */
  lines: number;
  /** Index into SENTENCES for the first line. */
  phrase: number;
}

const SENTENCES = [
  'QA note: label confirmed after a second look at the span boundaries.',
  'Model explanation: high attention on the second clause of the utterance.',
  'Agent log: retried the transcript fetch once after a gateway timeout.',
  'Reviewer disagreed with the Sentiment label and proposed Neutral instead.',
  'Inline diff expanded: three tokens changed between revision 4 and 5.',
  'Code block attached with the normalization script used for this batch.',
  'Escalated to the lead annotator; waiting on a tie-break decision.',
  'Auto-accepted: confidence above the batch threshold of 0.9.',
] as const;

const ITEM_COUNT = 100_000;
const ESTIMATE_HEIGHT = 48;
const VIEWPORT_HEIGHT = 480;

// Deterministic hash so every reload shows the same height pattern.
function hash(i: number): number {
  let h = (i + 1) * 2654435761;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return h >>> 0;
}

const ITEMS: readonly Entry[] = Array.from({ length: ITEM_COUNT }, (_, i) => {
  const h = hash(i);
  return {
    id: `item-${i}`,
    lines: (h % 6) + 1,
    phrase: (h >>> 8) % SENTENCES.length,
  };
});

function textFor(entry: Entry): string {
  return Array.from(
    { length: entry.lines },
    (_, k) => SENTENCES[(entry.phrase + k) % SENTENCES.length],
  ).join(' ');
}

function useRenderedRowCount(intervalMs: number): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const read = () => setCount(document.querySelectorAll('[role=listitem]').length);
    read();
    const id = window.setInterval(read, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return count;
}

export default function Demo() {
  const listRef = useRef<VirtualListHandle>(null);
  const [target, setTarget] = useState('50000');
  const renderedRows = useRenderedRowCount(500);

  const scrollTo = (index: number) => listRef.current?.scrollToIndex(index);

  const goToTarget = () => {
    const n = Number.parseInt(target, 10);
    if (Number.isFinite(n)) scrollTo(Math.min(ITEM_COUNT - 1, Math.max(0, n)));
  };

  return (
    <div className="demo">
      <h2>Variable Height Virtual List</h2>
      <p className="demo-note">
        Implement <code>computeOffsets</code>, <code>findStartIndex</code> and{' '}
        <code>VirtualList</code> in <code>virtual_list.tsx</code> — a windowed list
        that measures rows with <code>ResizeObserver</code>, caches heights by key,
        keeps the spacer honest and anchors <code>scrollTop</code> when a row above
        the viewport changes height. The fake data is {ITEM_COUNT.toLocaleString()}{' '}
        review-drawer entries whose text is 1–6 sentences long (deterministic per
        index), so every card wraps to a different height while{' '}
        <code>estimateHeight</code> stays {ESTIMATE_HEIGHT}. The &quot;rendered
        rows&quot; readout counts <code>[role=listitem]</code> nodes in the DOM every
        500ms — it should stay in the teens no matter where you scroll.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => scrollTo(0)}>Scroll to top</button>
          <button onClick={() => scrollTo(50_000)}>Scroll to 50,000</button>
          <button onClick={() => scrollTo(ITEM_COUNT - 1)}>Scroll to last</button>
          <label>
            Index{' '}
            <input
              type="number"
              min={0}
              max={ITEM_COUNT - 1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ width: '7em' }}
            />
          </label>
          <button onClick={goToTarget}>Go</button>
          <span>
            Rendered rows in DOM: <strong>{renderedRows}</strong> of{' '}
            {ITEM_COUNT.toLocaleString()}
          </span>
        </div>
        <VirtualList<Entry>
          ref={listRef}
          items={ITEMS}
          height={VIEWPORT_HEIGHT}
          estimateHeight={ESTIMATE_HEIGHT}
          getKey={(item) => item.id}
          renderItem={(item, index) => (
            <div
              style={{
                boxSizing: 'border-box',
                width: '100%',
                padding: '8px 12px',
                borderBottom: '1px solid #ddd',
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                #{index.toLocaleString()} · {item.lines} line{item.lines === 1 ? '' : 's'}
              </div>
              <div>{textFor(item)}</div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

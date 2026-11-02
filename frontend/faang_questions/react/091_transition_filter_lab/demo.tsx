import { useCallback, useEffect, useRef } from 'react';
import { FilterLab } from './filter_lab';

/**
 * Demo harness for the transition filter lab — auto-discovered by the
 * playground (playground/App.tsx). Renders the shipped <FilterLab /> over
 * 10,000 generated utterances with its `onListRender` probe wired to an
 * on-screen counter, next to a keystroke counter captured on the stage.
 * With a working deferral the list renders fewer times than you type.
 *
 * Counters are painted imperatively (ref + textContent) so the readout never
 * re-renders the tree it measures. StrictMode doubles dev counts.
 */
const KINDS = ['Sentiment', 'NER', 'Intent', 'Toxicity'] as const;

const ITEMS: string[] = Array.from(
  { length: 10000 },
  (_, i) => `utt-${String(i).padStart(4, '0')} · ${KINDS[i % KINDS.length]} sample ${i}`,
);

export default function Demo() {
  const counts = useRef({ listRenders: 0, keystrokes: 0 });
  const listCell = useRef<HTMLElement | null>(null);
  const keysCell = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const paint = useCallback(() => {
    if (listCell.current) listCell.current.textContent = String(counts.current.listRenders);
    if (keysCell.current) keysCell.current.textContent = String(counts.current.keystrokes);
  }, []);

  const onListRender = useCallback(() => {
    counts.current.listRenders += 1;
    paint();
  }, [paint]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onKeyDown = () => {
      counts.current.keystrokes += 1;
      paint();
    };
    stage.addEventListener('keydown', onKeyDown, true);
    return () => stage.removeEventListener('keydown', onKeyDown, true);
  }, [paint]);

  useEffect(() => {
    paint();
  });

  const reset = () => {
    counts.current = { listRenders: 0, keystrokes: 0 };
    paint();
  };

  return (
    <div className="demo">
      <h2>Transition Filter Lab</h2>
      <p className="demo-note">
        Implement <code>filterItems</code> and <code>FilterLab</code> in{' '}
        <code>filter_lab.tsx</code> using <code>useDeferredValue</code> or{' '}
        <code>useTransition</code> plus a <code>React.memo</code> list. Type fast into the filter
        (try <code>utt-12</code>): the input should echo every keystroke immediately while the
        10k-row list lags behind and shows &quot;Updating…&quot;. The counter proves it —{' '}
        <strong>list renders</strong> should stay below <strong>keystrokes</strong> because stale
        intermediate renders are discarded. Compare with the debounce in task 010: there the text
        itself waits for the timer; here nothing waits except the expensive list.
      </p>
      <div className="demo-stage" ref={stageRef}>
        <div className="demo-controls">
          <span>
            list renders:{' '}
            <strong
              ref={(el) => {
                listCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <span>
            keystrokes:{' '}
            <strong
              ref={(el) => {
                keysCell.current = el;
              }}
            >
              0
            </strong>
          </span>
          <button onClick={reset}>Reset counters</button>
        </div>
        <FilterLab items={ITEMS} onListRender={onListRender} />
      </div>
    </div>
  );
}

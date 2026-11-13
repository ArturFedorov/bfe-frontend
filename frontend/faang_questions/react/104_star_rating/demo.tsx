import { useState } from 'react';
import { StarRating } from './star_rating';

/**
 * Demo harness for StarRating — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is star_rating.test.tsx.
 */

export default function Demo() {
  const [value, setValue] = useState(3);
  const [allowHalf, setAllowHalf] = useState(true);
  const [allowClear, setAllowClear] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const onChange = (next: number) => {
    setLog((l) => [`onChange(${next})`, ...l].slice(0, 6));
    setValue(next);
  };

  return (
    <div className="demo">
      <h2>Star Rating</h2>
      <p className="demo-note">
        Implement <code>StarRating</code> and <code>clampRating</code> in <code>star_rating.tsx</code>:
        a <code>radiogroup</code> of <code>radio</code> stars with a hover preview that never calls{' '}
        <code>onChange</code>, click to set (click again to clear), <kbd>←</kbd>/<kbd>→</kbd>/
        <kbd>↑</kbd>/<kbd>↓</kbd> stepping (0.5 with half stars), <kbd>Home</kbd>/<kbd>End</kbd>,
        half stars from the pointer position, and a read-only <code>img</code> labelled{' '}
        <code>Rated N of M</code>.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            <input type="checkbox" checked={allowHalf} onChange={(e) => setAllowHalf(e.target.checked)} />{' '}
            Half stars
          </label>
          <label>
            <input type="checkbox" checked={allowClear} onChange={(e) => setAllowClear(e.target.checked)} />{' '}
            Click selected star to clear
          </label>
          <button type="button" onClick={() => setValue(0)}>
            Reset
          </button>
        </div>
        <div style={{ fontSize: 32, marginTop: 16 }}>
          <StarRating
            label="Review score"
            value={value}
            onChange={onChange}
            allowHalf={allowHalf}
            allowClear={allowClear}
          />
        </div>
        <p className="demo-note">
          Value: <strong>{value}</strong> · onChange log:{' '}
          {log.length === 0 ? 'none yet' : log.join(' · ')}
        </p>
        <h3 style={{ marginBottom: 4 }}>Read-only (asset page)</h3>
        <div style={{ fontSize: 24 }}>
          <StarRating label="Review score" value={value} allowHalf={allowHalf} readOnly />
        </div>
      </div>
    </div>
  );
}

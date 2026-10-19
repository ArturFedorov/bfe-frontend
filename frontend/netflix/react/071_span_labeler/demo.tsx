import { useState } from 'react';
import { SpanLabeler, Span } from './span_labeler';

/**
 * Demo harness for SpanLabeler — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is span_labeler.test.tsx.
 */

const TOKENS = [
  'On',
  'Tuesday',
  'Satya',
  'Nadella',
  'announced',
  'that',
  'Microsoft',
  'will',
  'open',
  'a',
  'new',
  'office',
  'in',
  'Dublin',
  'next',
  'March',
  '.',
];

const LABELS = ['PERSON', 'ORG', 'DATE', 'LOC'];

export default function Demo() {
  const [spans, setSpans] = useState<Span[]>([]);

  return (
    <div className="demo">
      <h2>Span Labeler</h2>
      <p className="demo-note">
        Implement <code>SpanLabeler</code> in <code>span_labeler.tsx</code> —
        click a token, shift+click (or Shift+Arrow) to extend, then pick a
        label. Click an existing span and press Delete to remove it. Ranges
        that cross an existing span are rejected.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setSpans([])} disabled={spans.length === 0}>
            Clear all
          </button>
        </div>
        <SpanLabeler tokens={TOKENS} labels={LABELS} value={spans} onChange={setSpans} />
      </div>
    </div>
  );
}

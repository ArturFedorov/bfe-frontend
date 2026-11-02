import { useState } from 'react';
import { SpanLabeler, Span } from './span_labeler_overlaps';

/**
 * Demo harness for SpanLabeler (overlaps) — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is span_labeler_overlaps.test.tsx.
 */

// "🍎" is one surrogate pair; "👩‍💻" is two pairs joined by a ZWJ — both sit
// next to span boundaries so snapping and Shift+Arrow stepping are exercised.
const TEXT =
  'On 12 March 2024, Tim Cook 🍎 joined Satya Nadella and the OpenAI 👩‍💻 team in San Francisco for the Spring Summit keynote.';

const LABELS = ['PERSON', 'ORG', 'DATE', 'EVENT'];

let nextSpanNumber = 1;
const newId = (): string => {
  const id = `span-${nextSpanNumber}`;
  nextSpanNumber += 1;
  return id;
};

/** Builds a span by locating `phrase` in TEXT so the offsets can never drift from the text. */
function spanOf(id: string, label: string, phrase: string): Span {
  const start = TEXT.indexOf(phrase);
  if (start < 0) throw new Error(`Preset phrase is not in the text: ${phrase}`);
  return { id, start, end: start + phrase.length, label };
}

// EVENT nests PERSON and crosses ORG, so both overlap shapes are visible on load.
const PRESET: Span[] = [
  spanOf('preset-date', 'DATE', '12 March 2024'),
  spanOf('preset-person', 'PERSON', 'Tim Cook'),
  spanOf('preset-event', 'EVENT', 'Tim Cook 🍎 joined Satya Nadella and the OpenAI'),
  spanOf('preset-org', 'ORG', 'OpenAI 👩‍💻 team'),
];

export default function Demo() {
  const [spans, setSpans] = useState<Span[]>(PRESET);

  return (
    <div className="demo">
      <h2>Span Labeler with Overlaps</h2>
      <p className="demo-note">
        Implement <code>SpanLabeler</code> in <code>span_labeler_overlaps.tsx</code> — select text
        with the mouse, pick a label from the palette, Shift+Arrow to adjust the pending end, click
        a single-label segment to select it, then relabel with the <code>Label</code> select or
        press Delete. Offsets are UTF-16 code units and must snap off surrogate pairs; the text
        includes emoji next to the preset boundaries for that reason. The preset has a nested and a
        crossing overlap so multi-label segments are visible immediately.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setSpans([])} disabled={spans.length === 0}>
            Clear all
          </button>
          <button onClick={() => setSpans(PRESET)} disabled={spans === PRESET}>
            Load preset
          </button>
        </div>
        <SpanLabeler text={TEXT} labels={LABELS} value={spans} onChange={setSpans} newId={newId} />
        <p className="demo-note">
          <strong>value</strong>
        </p>
        <pre>{JSON.stringify(spans, null, 2)}</pre>
      </div>
    </div>
  );
}

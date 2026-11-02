import { useState } from 'react';
import { SuggestionsPanel, type Suggestion } from './suggestions_panel';

/**
 * Demo harness for SuggestionsPanel — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is suggestions_panel.test.tsx.
 */

const LABELS = ['Intent', 'Entity', 'Sentiment', 'PII', 'Topic', 'Action'] as const;

const SPANS = [
  'cancel my subscription',
  'next Tuesday at 4pm',
  'the finale was perfect',
  'john.doe@example.com',
  'season 3 subtitles',
  'price hike',
  'refund the last charge',
  'buffering every two minutes',
  'available in 4K',
  'my whole family',
  'gift cards',
  'reset my password',
  'the Berlin office',
  'too loud at night',
] as const;

const SUGGESTION_COUNT = 14;

// Small deterministic LCG so "Regenerate" gives a different but reproducible set.
function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function makeSuggestions(seed: number, textVersion: number): Suggestion[] {
  const rnd = makeRng(seed);
  return Array.from({ length: SUGGESTION_COUNT }, (_, i) => {
    // Spread confidences across 0.30–0.98 with a little jitter per item.
    const base = 0.3 + (0.68 * i) / (SUGGESTION_COUNT - 1);
    const jitter = (rnd() - 0.5) * 0.08;
    const confidence = Math.min(0.98, Math.max(0.3, base + jitter));
    return {
      id: `s${seed}-${i + 1}`,
      label: LABELS[Math.floor(rnd() * LABELS.length)],
      text: SPANS[(i + Math.floor(rnd() * SPANS.length)) % SPANS.length],
      confidence: Math.round(confidence * 100) / 100,
      textVersion,
    };
  });
}

export default function Demo() {
  const [textVersion, setTextVersion] = useState(1);
  const [seed, setSeed] = useState(1);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() =>
    makeSuggestions(1, 1),
  );
  const [log, setLog] = useState<string[]>([]);

  // The parent owns the list: a decision removes the item(s) and records
  // one log line per callback invocation (accept-all should be ONE line).
  const handleAccept = (ids: string[]) => {
    const removed = new Set(ids);
    setSuggestions((prev) => prev.filter((s) => !removed.has(s.id)));
    setLog((prev) => [...prev, `accept(${ids.length}): ${ids.join(', ')}`]);
  };

  const handleReject = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    setLog((prev) => [...prev, `reject: ${id}`]);
  };

  const regenerate = () => {
    const next = seed + 1;
    setSeed(next);
    setSuggestions(makeSuggestions(next, textVersion));
  };

  return (
    <div className="demo">
      <h2>Model Suggestions Panel</h2>
      <p className="demo-note">
        Implement <code>filterSuggestions</code> and <code>SuggestionsPanel</code> in{' '}
        <code>suggestions_panel.tsx</code> — a fully controlled listbox of model
        pre-labels with a confidence threshold slider, roving tabindex
        (<kbd>↑</kbd>/<kbd>↓</kbd>, <kbd>Enter</kbd> accepts, <kbd>Delete</kbd>{' '}
        rejects) and a single <code>onAccept(ids)</code> call for
        &quot;Accept all above threshold&quot;. The fake data is {SUGGESTION_COUNT}{' '}
        generated suggestions with confidences spread from 0.30 to 0.98, all tagged
        with the current text version. &quot;Bump text version&quot; makes every
        listed suggestion stale, so they vanish and the status reads{' '}
        <code>N suggestions discarded (text changed)</code>; &quot;Regenerate&quot;
        produces a fresh set for the current version. Every decision is appended to
        the log below the panel — accept-all should produce exactly one line.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setTextVersion((v) => v + 1)}>Bump text version</button>
          <button onClick={regenerate}>Regenerate suggestions</button>
          <button onClick={() => setLog([])}>Reset log</button>
          <span>
            textVersion = {textVersion} · {suggestions.length} suggestions in props
          </span>
        </div>
        <SuggestionsPanel
          suggestions={suggestions}
          textVersion={textVersion}
          onAccept={handleAccept}
          onReject={handleReject}
        />
        <div>
          <strong>Decision log ({log.length})</strong>
          {log.length === 0 ? (
            <p>No decisions yet.</p>
          ) : (
            <ol>
              {log.map((line, i) => (
                <li key={i}>
                  <code>{line}</code>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

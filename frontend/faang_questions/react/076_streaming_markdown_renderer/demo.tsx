import { useCallback, useEffect, useState } from 'react';
import { StreamingMarkdown } from './streaming_markdown';

/**
 * Demo harness for StreamingMarkdown — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is streaming_markdown.test.tsx.
 */

// The rationale the fake model writes. Built from lines so the backticks and
// fences stay readable here; the hazards are all in: a javascript: link, raw
// <img>/<script> tags that must stay text, and a fence that arrives half-open.
const DOCUMENT = [
  '# Suggested label: MEDICATION',
  '',
  'The highlighted span **amoxicillin 500 mg** names a drug *together with* a dose and a frequency, which matches the `MEDICATION` guideline rather than `PROCEDURE`.',
  '',
  '## Evidence',
  '',
  'Two neighbouring annotators labelled near-identical spans the same way — see the [labelling guideline](https://example.com/guidelines/medication). The model also emitted [this link](javascript:alert(1)), which must stay literal text with no anchor. Questions go to [the QA lead](mailto:qa@example.com).',
  '',
  '### Raw model output',
  '',
  '```json',
  '{ "label": "MEDICATION", "confidence": 0.93, "span": [412, 431] }',
  '```',
  '',
  'The scraped source document contained <img src=x onerror=alert(1)> and <script>alert(2)</script>, which must render as text — no `img` or `script` element may exist. Nested *emphasis with `code` inside* is fine too.',
  '',
  '#### Four hashes are not a heading',
].join('\n');

// Tokens of at most four non-space characters, or a run of whitespace, so
// `**bold**`, backticks and fences arrive half-open before they close.
const TOKENS: string[] = DOCUMENT.match(/\S{1,4}|\s+/g) ?? [];

type Speed = 'normal' | 'fast';
const DELAY_MS: Record<Speed, [min: number, max: number]> = {
  normal: [30, 80],
  fast: [8, 20],
};

export default function Demo() {
  const [runKey, setRunKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [commits, setCommits] = useState(0);

  const done = index >= TOKENS.length;
  const source = TOKENS.slice(0, index).join('');

  // Fake model: one token per timeout, 30–80ms apart (8–20ms when fast).
  useEffect(() => {
    if (paused || done) return;
    const [min, max] = DELAY_MS[speed];
    const id = window.setTimeout(() => setIndex((i) => i + 1), min + Math.random() * (max - min));
    return () => window.clearTimeout(id);
  }, [index, paused, done, speed]);

  const onCommit = useCallback(() => setCommits((c) => c + 1), []);

  const restart = () => {
    setRunKey((k) => k + 1);
    setIndex(0);
    setPaused(false);
    setCommits(0);
  };

  return (
    <div className="demo">
      <h2>Streaming Markdown Renderer</h2>
      <p className="demo-note">
        Implement <code>StreamingMarkdown</code> in <code>streaming_markdown.tsx</code>{' '}
        — a safe-subset markdown renderer (headings, bold/italic, inline code,
        fenced code, http/https/mailto links only) that is correct on partial input,
        never injects HTML, and commits at most once per animation frame. The fake
        model streams a rationale in 1–4 character tokens every 30–80ms; the raw
        source is on the right for comparison. Expect the{' '}
        <code>javascript:</code> link and the <code>&lt;img onerror&gt;</code> /{' '}
        <code>&lt;script&gt;</code> tags to show up as plain text, and the code fence
        to render as a code block even while it is still open.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={restart}>Restart</button>
          <button onClick={() => setPaused((p) => !p)} disabled={done}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={() => setSpeed((s) => (s === 'normal' ? 'fast' : 'normal'))}>
            Speed: {speed === 'normal' ? '1×' : '4×'}
          </button>
        </div>
        <p role="status">
          {done ? 'Done' : paused ? 'Paused' : 'Streaming'} · tokens {index}/{TOKENS.length} ·
          DOM commits {commits}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.75rem' }}>
            <StreamingMarkdown key={runKey} source={source} done={done} onCommit={onCommit} />
          </div>
          <pre
            aria-label="Raw source"
            style={{
              margin: 0,
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: '0.75rem',
              background: '#f9fafb',
            }}
          >
            {source}
          </pre>
        </div>
      </div>
    </div>
  );
}

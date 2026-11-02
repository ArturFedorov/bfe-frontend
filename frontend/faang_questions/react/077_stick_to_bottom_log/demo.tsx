import { useEffect, useRef, useState } from 'react';
import { StickToBottomLog } from './stick_to_bottom_log';

/**
 * Demo harness for StickToBottomLog — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is stick_to_bottom_log.test.tsx.
 */

const TOOLS = ['fetch_items', 'call_model', 'validate', 'write_suggestions', 'notify'];

const TEMPLATES = [
  (n: number, tool: string) =>
    `[${stamp(n)}] ${tool} → started for batch-42 (120 items pending); worker gpu-pool-b picked up the job and is warming the segmenter-v3 weights`,
  (n: number, tool: string) =>
    `[${stamp(n)}] ${tool} → chunk ${n % 4 + 1}/4 produced 30 predictions, mean confidence ${(0.8 + (n % 17) / 100).toFixed(2)}, 2 below the 0.5 floor were dropped`,
  (n: number, tool: string) =>
    `[${stamp(n)}] ${tool} → validation: label schema ok, bbox bounds ok, class coverage ok, ${n % 3} duplicate boxes flagged for review`,
  (n: number, tool: string) =>
    `[${stamp(n)}] ${tool} → WARN item img_${1000 + n}.png has a proposed relabel car→vehicle that conflicts with a prior human annotation; skipping`,
  (n: number, tool: string) =>
    `[${stamp(n)}] ${tool} → finished in ${120 + (n * 37) % 900}ms; wrote ${n % 30} suggestion rows and notified ${n % 3 + 1} reviewers`,
];

function stamp(n: number): string {
  const s = n * 7;
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `00:${mm}:${ss}`;
}

function makeLine(n: number): string {
  const tool = TOOLS[n % TOOLS.length];
  const template = TEMPLATES[(n * 3) % TEMPLATES.length];
  return template(n, tool);
}

export default function Demo() {
  const [lines, setLines] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [runKey, setRunKey] = useState(0);
  const counter = useRef(0);

  const append = (count: number) => {
    const fresh: string[] = [];
    for (let i = 0; i < count; i++) {
      counter.current += 1;
      fresh.push(makeLine(counter.current));
    }
    setLines((prev) => [...prev, ...fresh]);
  };

  // Fake transcript stream: one line every 300–700ms while streaming is on.
  useEffect(() => {
    if (!streaming) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        counter.current += 1;
        const line = makeLine(counter.current);
        setLines((prev) => [...prev, line]);
        schedule();
      }, 300 + Math.random() * 400);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [streaming]);

  const clear = () => {
    setStreaming(false);
    setLines([]);
    setFollowing(null);
    counter.current = 0;
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Stick-to-Bottom Log</h2>
      <p className="demo-note">
        Implement <code>StickToBottomLog</code> in <code>stick_to_bottom_log.tsx</code> — a{' '}
        <code>role=&quot;log&quot;</code> container that pins to the bottom while the analyst is
        there, stops following the moment they scroll up, and offers{' '}
        <code>Jump to latest (N new)</code>. The fake agent appends one long transcript line every
        300–700ms; start streaming, then scroll up mid-stream to see the count grow and the Jump
        button appear. Burst adds 20 lines at once; Clear remounts the log.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setStreaming((s) => !s)}>
            {streaming ? 'Stop streaming' : 'Start streaming'}
          </button>
          <button onClick={() => append(20)}>Burst 20 lines</button>
          <button onClick={clear}>Clear</button>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
            {lines.length} lines ·{' '}
            {following === null ? 'following (initial)' : following ? 'following' : 'scrolled away'}
          </span>
        </div>
        {/* Fixed-height wrapper: a single grid track so the log fills it and scrolls internally. */}
        <div
          style={{
            marginTop: '1rem',
            height: 280,
            display: 'grid',
            gridTemplateRows: 'minmax(0, 1fr)',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            overflow: 'hidden',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.8rem',
          }}
        >
          <StickToBottomLog
            key={runKey}
            lines={lines}
            streaming={streaming}
            onFollowChange={setFollowing}
          />
        </div>
      </div>
    </div>
  );
}

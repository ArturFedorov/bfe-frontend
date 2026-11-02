import { useEffect, useState } from 'react';
import { parseSSE, type SSEMessage } from './sse_stream_parser';

/**
 * Demo harness for parseSSE — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is sse_stream_parser.test.ts.
 */

// What the "suggest label rationale" backend sends: CRLF terminators, a
// comment, a retry hint, a data-less `ping` block, a multi-line data block, an
// id reset, and a trailing block with no blank line that must be discarded.
const TRANSCRIPT = [
  ': model warm-up',
  'retry: 2500',
  'id: 1',
  'event: suggestion',
  'data: Label: **MEDICATION**',
  '',
  'id: 2',
  'data: The span names café-au-lait dosage 💊 twice daily',
  '',
  'event: ping',
  '',
  'id: 3',
  'data: line one',
  'data: line two',
  '',
  'id:',
  'data:nospace, then two spaces',
  'data:  indented',
  'unknown: field is ignored',
  '',
  'event: done',
  'data: [DONE]',
  '',
  'data: incomplete block — discarded at EOF',
].join('\r\n');

// Where each chunk ENDS. `marker` is the last text in the chunk; `extraBytes`
// pushes the cut further into the following multibyte character.
interface Cut {
  marker: string;
  extraBytes?: number;
  why: string;
}

const CUTS: Cut[] = [
  { marker: 'retry: 25', why: 'mid-line, inside "retry: 2500"' },
  { marker: 'data: Label: **MEDI', why: 'mid-line, inside a data value' },
  { marker: 'caf', extraBytes: 1, why: 'inside the 2-byte "é"' },
  { marker: 'dosage ', extraBytes: 2, why: 'inside the 4-byte 💊' },
  { marker: 'data: line one\r', why: 'between \\r and \\n' },
  { marker: 'data: [DONE]\r\n\r\n', why: 'several whole frames in one chunk' },
];

interface ScriptedChunk {
  bytes: Uint8Array;
  why: string;
}

const encoder = new TextEncoder();

function byteOffsetAfter(marker: string, extraBytes = 0): number {
  const at = TRANSCRIPT.indexOf(marker);
  if (at < 0) throw new Error(`Demo transcript is missing marker: ${marker}`);
  return encoder.encode(TRANSCRIPT.slice(0, at + marker.length)).byteLength + extraBytes;
}

const CHUNKS: ScriptedChunk[] = (() => {
  const bytes = encoder.encode(TRANSCRIPT);
  const out: ScriptedChunk[] = [];
  let start = 0;
  for (const cut of CUTS) {
    const end = byteOffsetAfter(cut.marker, cut.extraBytes);
    out.push({ bytes: bytes.slice(start, end), why: cut.why });
    start = end;
  }
  out.push({ bytes: bytes.slice(start), why: 'end of stream, no trailing blank line' });
  return out;
})();

interface ChunkLogEntry {
  index: number;
  byteLength: number;
  why: string;
  /** Per-chunk `TextDecoder().decode()` — shows U+FFFD where a char was split. */
  naive: string;
}

// Fake `response.body`: enqueues the scripted chunks 150–400ms apart. Cancel
// (which parseSSE must do on abort / break) or dispose stops the timers.
function createTranscriptStream(onChunk: (entry: ChunkLogEntry) => void): {
  stream: ReadableStream<Uint8Array>;
  dispose: () => void;
} {
  const timers: number[] = [];
  let finished = false;
  let ctrl: ReadableStreamDefaultController<Uint8Array> | null = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach((id) => window.clearTimeout(id));
    timers.length = 0;
    try {
      ctrl?.close();
    } catch {
      // Already closed or cancelled by the consumer.
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      ctrl = controller;
      let at = 0;
      CHUNKS.forEach((chunk, i) => {
        at += 150 + Math.random() * 250;
        timers.push(
          window.setTimeout(() => {
            if (finished) return;
            onChunk({
              index: i + 1,
              byteLength: chunk.bytes.byteLength,
              why: chunk.why,
              naive: new TextDecoder().decode(chunk.bytes),
            });
            controller.enqueue(chunk.bytes);
            if (i === CHUNKS.length - 1) finish();
          }, at),
        );
      });
    },
    cancel() {
      finish();
    },
  });

  return { stream, dispose: finish };
}

function visible(text: string): string {
  return text.replace(/\r/g, '␍').replace(/\n/g, '␊\n');
}

type Phase = 'streaming' | 'done' | 'aborted' | 'error';

function ParserHarness({ signal }: { signal: AbortSignal }) {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [chunks, setChunks] = useState<ChunkLogEntry[]>([]);
  const [phase, setPhase] = useState<Phase>('streaming');
  const [error, setError] = useState<string | null>(null);
  const [lockReleased, setLockReleased] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const { stream, dispose } = createTranscriptStream((entry) => {
      if (active) setChunks((prev) => [...prev, entry]);
    });
    // Called synchronously so an unsolved stub throws here and the playground
    // boundary shows the assignment card instead of an unhandled rejection.
    const iterable = parseSSE(stream, { signal });
    (async () => {
      try {
        for await (const message of iterable) {
          if (!active) break;
          setMessages((prev) => [...prev, message]);
        }
        if (active) setPhase(signal.aborted ? 'aborted' : 'done');
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      } finally {
        // Requirement 10/11: abort, break and error must all release the reader lock.
        if (active) setLockReleased(!stream.locked);
      }
    })();
    return () => {
      active = false;
      dispose();
    };
  }, [signal]);

  const statusText =
    phase === 'streaming'
      ? 'Streaming…'
      : phase === 'done'
        ? `Stream closed — ${messages.length} messages dispatched`
        : phase === 'aborted'
          ? `Stopped by abort after ${messages.length} messages`
          : `Stream error: ${error}`;

  return (
    <>
      <p role={phase === 'error' ? 'alert' : 'status'}>
        {statusText}
        {lockReleased !== null && (
          <>
            {' '}
            · reader lock released: <code>{lockReleased ? 'yes' : 'no'}</code>
          </>
        )}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <section aria-label="Raw chunks">
          <h3 style={{ marginTop: 0 }}>Raw chunks ({chunks.length}/{CHUNKS.length})</h3>
          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.8rem' }}>
            {chunks.map((c) => (
              <li key={c.index} style={{ marginBottom: '0.5rem' }}>
                <div style={{ color: '#6b7280' }}>
                  {c.byteLength} B — ends {c.why}
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {visible(c.naive)}
                </pre>
              </li>
            ))}
          </ol>
        </section>
        <section aria-label="Parsed messages">
          <h3 style={{ marginTop: 0 }}>Parsed messages ({messages.length})</h3>
          <table style={{ fontSize: '0.8rem', borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th align="left">event</th>
                <th align="left">id</th>
                <th align="left">retry</th>
                <th align="left">data</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m, i) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td>
                    <code>{m.event}</code>
                  </td>
                  <td>
                    <code>{m.id ?? 'null'}</code>
                  </td>
                  <td>
                    <code>{m.retry ?? 'null'}</code>
                  </td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{m.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

interface Run {
  key: number;
  controller: AbortController;
}

export default function Demo() {
  const [run, setRun] = useState<Run | null>(null);

  const start = () =>
    setRun((prev) => ({ key: (prev?.key ?? 0) + 1, controller: new AbortController() }));
  const abort = () => run?.controller.abort();

  return (
    <div className="demo">
      <h2>SSE Stream Parser</h2>
      <p className="demo-note">
        Implement <code>parseSSE</code> in <code>sse_stream_parser.ts</code> — turn a{' '}
        <code>ReadableStream&lt;Uint8Array&gt;</code> into an async iterable of SSE
        messages with streaming UTF-8 decoding, CRLF handling and abort/break
        cleanup. The fake backend streams one scripted transcript in chunks 150–400ms
        apart, cut at the nastiest boundaries: mid-line, inside the bytes of{' '}
        <code>é</code> and an emoji, and between <code>\r</code> and <code>\n</code>.
        The left column decodes each chunk on its own (so split characters show as
        <code>�</code>); the right column is what your parser yields — it should
        read cleanly regardless of where the chunks were cut. The last block has no
        blank line and must not appear.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={start} disabled={run !== null}>
            Start
          </button>
          <button onClick={abort} disabled={run === null}>
            Abort
          </button>
          <button onClick={start} disabled={run === null}>
            Restart
          </button>
        </div>
        {run ? (
          <ParserHarness key={run.key} signal={run.controller.signal} />
        ) : (
          <p>Press Start to open the stream.</p>
        )}
      </div>
    </div>
  );
}

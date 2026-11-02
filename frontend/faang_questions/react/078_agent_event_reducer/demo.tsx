import { useEffect, useReducer, useRef, useState } from 'react';
import {
  AgentEvent,
  RunState,
  ToolCallNode,
  agentRunReducer,
  initialRunState,
  selectRunning,
  selectTree,
} from './agent_event_reducer';

/**
 * Demo harness for agentRunReducer — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is agent_event_reducer.test.ts.
 *
 * The reducer is pure TypeScript, so this harness is the "UI" — it feeds a
 * scripted event stream through `useReducer` and renders the resulting tree.
 */

// Scripted stream as the server would publish it: seq is contiguous from 1.
const SCRIPT: AgentEvent[] = [
  { eventId: 'e01', seq: 1, type: 'run_started' },
  { eventId: 'e02', seq: 2, type: 'call_started', callId: 'fetch', parentId: null, tool: 'fetch_items' },
  { eventId: 'e03', seq: 3, type: 'call_output', callId: 'fetch', chunk: 'Querying batch-42…\n' },
  { eventId: 'e04', seq: 4, type: 'call_output', callId: 'fetch', chunk: '120 items pending annotation\n' },
  { eventId: 'e05', seq: 5, type: 'call_finished', callId: 'fetch', status: 'succeeded' },
  { eventId: 'e06', seq: 6, type: 'call_started', callId: 'model', parentId: null, tool: 'call_model' },
  { eventId: 'e07', seq: 7, type: 'call_started', callId: 'model-b1', parentId: 'model', tool: 'segment_batch' },
  { eventId: 'e08', seq: 8, type: 'call_started', callId: 'model-b2', parentId: 'model', tool: 'segment_batch' },
  { eventId: 'e09', seq: 9, type: 'call_output', callId: 'model-b1', chunk: 'batch 1/2 → 30 predictions\n' },
  { eventId: 'e10', seq: 10, type: 'call_output', callId: 'model-b2', chunk: 'batch 2/2 → 11 predictions\n' },
  { eventId: 'e11', seq: 11, type: 'call_finished', callId: 'model-b1', status: 'succeeded' },
  { eventId: 'e12', seq: 12, type: 'call_output', callId: 'model-b2', chunk: 'CUDA error: out of memory\n' },
  { eventId: 'e13', seq: 13, type: 'call_finished', callId: 'model-b2', status: 'failed', message: 'GPU out of memory' },
  { eventId: 'e14', seq: 14, type: 'call_finished', callId: 'model', status: 'failed', message: '1 of 2 batches failed' },
  { eventId: 'e15', seq: 15, type: 'call_started', callId: 'validate', parentId: null, tool: 'validate' },
  { eventId: 'e16', seq: 16, type: 'call_output', callId: 'validate', chunk: 'Checking label schema… ok\n' },
  { eventId: 'e17', seq: 17, type: 'call_finished', callId: 'validate', status: 'succeeded' },
  { eventId: 'e18', seq: 18, type: 'run_finished', status: 'failed' },
];

interface LogEntry {
  key: number;
  seq: number;
  eventId: string;
  type: AgentEvent['type'];
  changed: boolean;
  note: string;
}

const STATUS_COLOR: Record<ToolCallNode['status'], string> = {
  queued: '#6b7280',
  running: '#2563eb',
  succeeded: '#15803d',
  failed: '#b91c1c',
  cancelled: '#a16207',
};

function Badge({ status }: { status: ToolCallNode['status'] }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0 0.4rem',
        borderRadius: 999,
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#fff',
        background: STATUS_COLOR[status],
        marginLeft: '0.4rem',
        verticalAlign: 'middle',
      }}
    >
      {status}
    </span>
  );
}

function Tree({ nodes }: { nodes: ToolCallNode[] }) {
  if (nodes.length === 0) return <p style={{ color: '#6b7280' }}>No tool calls yet.</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
      {nodes.map((node) => (
        <li key={node.id} style={{ marginBottom: '0.35rem' }}>
          <code>{node.tool}</code> <span style={{ color: '#6b7280' }}>({node.id})</span>
          <Badge status={node.status} />
          {node.message && <span style={{ color: '#b91c1c', marginLeft: '0.4rem' }}>— {node.message}</span>}
          {node.output && (
            <pre
              style={{
                margin: '0.25rem 0 0',
                padding: '0.35rem 0.5rem',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {node.output}
            </pre>
          )}
          {node.children.length > 0 && <Tree nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function Harness() {
  const [run, dispatch] = useReducer(agentRunReducer, initialRunState);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cursor, setCursor] = useState(0); // index of the next in-order event
  const [playing, setPlaying] = useState(false);
  const [queue, setQueue] = useState<AgentEvent[]>([]); // shuffled remainder being fed in

  // Shadow of the latest reducer state so a dispatch can report prev === next
  // even when several events are fed within one tick. The reducer is pure, so
  // computing it here and again inside React yields the same result.
  const shadow = useRef<RunState>(initialRunState);
  const lastEvent = useRef<AgentEvent | null>(null);
  const logKey = useRef(0);

  // Selectors run on every render — with the stub they throw "Not implemented"
  // and the playground boundary shows the assignment card instead.
  const tree = selectTree(run);
  const runningCount = selectRunning(run).length;

  const feed = (event: AgentEvent, note: string) => {
    const prev = shadow.current;
    const next = agentRunReducer(prev, event);
    shadow.current = next;
    lastEvent.current = event;
    dispatch(event);
    logKey.current += 1;
    const entry: LogEntry = {
      key: logKey.current,
      seq: event.seq,
      eventId: event.eventId,
      type: event.type,
      changed: next !== prev,
      note,
    };
    setLog((entries) => [entry, ...entries].slice(0, 40));
  };

  const step = () => {
    if (cursor >= SCRIPT.length) return;
    feed(SCRIPT[cursor], 'in order');
    setCursor(cursor + 1);
  };

  const shuffleReplay = () => {
    const remaining = SCRIPT.slice(cursor);
    if (remaining.length === 0) return;
    setPlaying(false);
    setCursor(SCRIPT.length);
    setQueue(shuffle(remaining));
  };

  const duplicateLast = () => {
    if (!lastEvent.current) return;
    feed(lastEvent.current, 'duplicate eventId');
  };

  // Play: one in-order event every 400ms.
  useEffect(() => {
    if (!playing) return;
    if (cursor >= SCRIPT.length) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => {
      feed(SCRIPT[cursor], 'in order (play)');
      setCursor(cursor + 1);
    }, 400);
    return () => clearTimeout(id);
  }, [playing, cursor]);

  // Shuffle replay: drain the shuffled queue one event per 250ms so the
  // buffered list visibly grows and then collapses as gaps fill.
  useEffect(() => {
    if (queue.length === 0) return;
    const id = setTimeout(() => {
      const [head, ...rest] = queue;
      feed(head, 'shuffled');
      setQueue(rest);
    }, 250);
    return () => clearTimeout(id);
  }, [queue]);

  const done = cursor >= SCRIPT.length && queue.length === 0;
  const bufferedSeqs = run.buffered.map((e) => e.seq).sort((a, b) => a - b);

  return (
    <>
      <div className="demo-controls">
        <button onClick={step} disabled={cursor >= SCRIPT.length || queue.length > 0}>
          Step
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={done || queue.length > 0}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={shuffleReplay} disabled={cursor >= SCRIPT.length}>
          Shuffle replay ({SCRIPT.length - cursor} left)
        </button>
        <button onClick={duplicateLast} disabled={!lastEvent.current}>
          Duplicate last
        </button>
      </div>

      <p role="status" style={{ marginBottom: '0.25rem' }}>
        Run <strong>{run.status}</strong> · lastSeq {run.lastSeq} · {runningCount} running ·{' '}
        {bufferedSeqs.length === 0 ? 'nothing buffered' : `buffered seq [${bufferedSeqs.join(', ')}]`}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
        <section>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Tool-call tree (selectTree)</h3>
          <Tree nodes={tree} />
        </section>
        <section>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Dispatch log (newest first)</h3>
          {log.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Nothing dispatched yet.</p>
          ) : (
            <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', width: '100%' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '0 0.4rem 0.2rem 0' }}>seq</th>
                  <th style={{ padding: '0 0.4rem 0.2rem 0' }}>eventId</th>
                  <th style={{ padding: '0 0.4rem 0.2rem 0' }}>type</th>
                  <th style={{ padding: '0 0.4rem 0.2rem 0' }}>state</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.key} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.15rem 0.4rem 0.15rem 0' }}>{entry.seq}</td>
                    <td style={{ padding: '0.15rem 0.4rem 0.15rem 0' }}>
                      <code>{entry.eventId}</code>
                    </td>
                    <td style={{ padding: '0.15rem 0.4rem 0.15rem 0' }}>
                      {entry.type}
                      <span style={{ color: '#9ca3af' }}> · {entry.note}</span>
                    </td>
                    <td
                      style={{
                        padding: '0.15rem 0 0.15rem 0',
                        fontWeight: 600,
                        color: entry.changed ? '#15803d' : '#6b7280',
                      }}
                    >
                      {entry.changed ? 'changed' : 'same ref'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

export default function Demo() {
  const [runKey, setRunKey] = useState(0);

  return (
    <div className="demo">
      <h2>Agent Event Reducer</h2>
      <p className="demo-note">
        Implement <code>agentRunReducer</code>, <code>selectTree</code> and{' '}
        <code>selectRunning</code> in <code>agent_event_reducer.ts</code> — a pure event-sourcing
        reducer that is idempotent by <code>eventId</code>, applies events in strict{' '}
        <code>seq</code> order (buffering gaps, ignoring stale replays) and shares structure for
        untouched calls. This harness feeds an 18-event scripted run (nested model batches, one
        failure) through <code>useReducer</code>. Step and Play apply events in order; Shuffle
        replay feeds the remaining events in random order so you can watch the buffer fill and
        drain; Duplicate last re-dispatches the previous event and the log shows whether the
        state reference changed.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={() => setRunKey((k) => k + 1)}>Reset</button>
        </div>
        <Harness key={runKey} />
      </div>
    </div>
  );
}

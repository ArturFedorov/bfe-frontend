import { useEffect, useState } from 'react';
import { useEventStream, type StreamStatus, type UseEventStreamOptions } from './use_event_stream';

/**
 * Demo harness for useEventStream — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is use_event_stream.test.tsx.
 */

const STREAM_URL = '/runs/42/events';
const OPEN_DELAY_MS = 300;
const TICK_MS = 800;
const DROP_AFTER = 7;

const STEPS = [
  'loading batch manifest',
  'tokenising documents',
  'running NER pre-annotation',
  'scoring span confidence',
  'writing suggestions to store',
  'notifying reviewers',
];

// Server-side state shared by every connection so ids stay monotonic across
// reconnects. `lastId` is the newest id the server has ever sent.
const server = { lastId: 0 };

type Listener = EventListenerOrEventListenerObject;

/**
 * In-browser EventSource double with the same surface the hook uses. It emits
 * numbered `step` events every ~800ms, drops the connection after every
 * DROP_AFTER events (reporting `error` and staying CLOSED so the hook owns the
 * backoff), and on reconnect honours `?lastEventId=` by replaying from that id
 * inclusive — the first replayed event is therefore a duplicate.
 */
class DemoEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  /** Most recently constructed instance — the "Drop connection now" target. */
  static current: DemoEventSource | null = null;
  static log: ((line: string) => void) | null = null;

  readonly url: string;
  readonly withCredentials = false;
  readyState: number = DemoEventSource.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private listeners = new Map<string, Set<Listener>>();
  private openTimer: number | null = null;
  private interval: number | null = null;
  private cursor: number;
  private sinceOpen = 0;

  constructor(url: string | URL) {
    this.url = String(url);
    DemoEventSource.current = this;
    const resume = new URL(this.url, 'http://demo.local').searchParams.get('lastEventId');
    this.cursor = resume === null ? server.lastId + 1 : Number(resume);
    DemoEventSource.say(
      resume === null
        ? `connect ${this.url}`
        : `connect ${this.url} — replaying from id ${resume} (duplicate)`,
    );
    this.openTimer = window.setTimeout(() => this.open(), OPEN_DELAY_MS);
  }

  private static say(line: string): void {
    DemoEventSource.log?.(line);
  }

  addEventListener(type: string, listener: Listener | null): void {
    if (!listener) return;
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: Listener | null): void {
    if (listener) this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    this.fire(event.type, event);
    return true;
  }

  close(): void {
    this.clearTimers();
    if (this.readyState !== DemoEventSource.CLOSED) DemoEventSource.say('close() called by client');
    this.readyState = DemoEventSource.CLOSED;
  }

  /** Simulated network drop. */
  fail(reason: string): void {
    if (this.readyState === DemoEventSource.CLOSED) return;
    this.clearTimers();
    this.readyState = DemoEventSource.CLOSED;
    DemoEventSource.say(`error — ${reason}`);
    const event = new Event('error');
    this.onerror?.(event);
    this.fire('error', event);
  }

  private open(): void {
    this.openTimer = null;
    this.readyState = DemoEventSource.OPEN;
    this.sinceOpen = 0;
    DemoEventSource.say('open');
    const event = new Event('open');
    this.onopen?.(event);
    this.fire('open', event);
    // An id-less greeting: must be kept every time (never deduped).
    this.emit('message', `connected to run 42 (server is at id ${server.lastId})`, '');
    this.interval = window.setInterval(() => this.tick(), TICK_MS);
  }

  private tick(): void {
    const id = this.cursor;
    this.cursor += 1;
    this.sinceOpen += 1;
    server.lastId = Math.max(server.lastId, id);
    this.emit('step', `${STEPS[id % STEPS.length]} (#${id})`, String(id));
    if (this.sinceOpen >= DROP_AFTER) this.fail(`connection dropped after ${DROP_AFTER} events`);
  }

  private emit(type: 'message' | 'step', data: string, lastEventId: string): void {
    if (this.readyState !== DemoEventSource.OPEN) return;
    DemoEventSource.say(`${type} id=${lastEventId || '(none)'} ${data}`);
    const event = new MessageEvent<string>(type, { data, lastEventId });
    if (type === 'message') this.onmessage?.(event);
    this.fire(type, event);
  }

  private fire(type: string, event: Event): void {
    this.listeners.get(type)?.forEach((listener) => {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    });
  }

  private clearTimers(): void {
    if (this.openTimer !== null) window.clearTimeout(this.openTimer);
    if (this.interval !== null) window.clearInterval(this.interval);
    this.openTimer = null;
    this.interval = null;
  }
}

const globalScope = globalThis as Record<string, unknown>;

function installDemoEventSource(): () => void {
  const original = globalScope.EventSource;
  globalScope.EventSource = DemoEventSource;
  server.lastId = 0;
  return () => {
    DemoEventSource.current?.close();
    DemoEventSource.current = null;
    globalScope.EventSource = original;
  };
}

const STATUS_LABEL: Record<StreamStatus, string> = {
  connecting: 'Connecting',
  open: 'Live',
  reconnecting: 'Reconnecting',
  closed: 'Disconnected',
};

// Module constant: the hook must not re-subscribe when options change identity,
// but there is no reason to tempt it from a demo.
const OPTIONS: UseEventStreamOptions = { baseMs: 1000, maxMs: 8000, eventTypes: ['step'] };

function useElapsedMs(active: boolean): number {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!active) {
      setMs(0);
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(() => setMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(id);
  }, [active]);
  return ms;
}

function StreamPanel({ onRestart }: { onRestart: () => void }) {
  const { status, events, lastEventId, close } = useEventStream(STREAM_URL, OPTIONS);
  const waitingMs = useElapsedMs(status === 'reconnecting');

  return (
    <>
      <div className="demo-controls">
        <button
          onClick={() => DemoEventSource.current?.fail('dropped by the Drop button')}
          disabled={status !== 'open'}
        >
          Drop connection now
        </button>
        <button onClick={close} disabled={status === 'closed'}>
          Close
        </button>
        <button onClick={onRestart}>Restart</button>
      </div>
      <p role="status">
        <strong>{STATUS_LABEL[status]}</strong>
        {status === 'reconnecting' && ` — waiting ${(waitingMs / 1000).toFixed(1)}s (backoff grows per consecutive failure)`}
      </p>
      <p>
        lastEventId: <code>{lastEventId ?? 'null'}</code> · events kept: {events.length}
      </p>
      <ol
        aria-label="Agent run events"
        style={{ maxHeight: '16rem', overflowY: 'auto', fontSize: '0.85rem', paddingLeft: '1.25rem' }}
      >
        {events.map((e, i) => (
          <li key={i}>
            <code>{e.type}</code> <code>id={e.id ?? 'null'}</code> {e.data}
          </li>
        ))}
      </ol>
    </>
  );
}

export default function Demo() {
  const [installed, setInstalled] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  // Install the fake before the child mounts (children's effects run before
  // the parent's, so the hook would otherwise grab the real EventSource).
  useEffect(() => {
    const restore = installDemoEventSource();
    DemoEventSource.log = (line) =>
      setLog((prev) => [...prev.slice(-39), `${new Date().toLocaleTimeString()}  ${line}`]);
    setInstalled(true);
    return () => {
      DemoEventSource.log = null;
      restore();
      setInstalled(false);
    };
  }, []);

  const restart = () => {
    setLog([]);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Reconnecting Event Source</h2>
      <p className="demo-note">
        Implement <code>useEventStream</code> in <code>use_event_stream.ts</code> — one{' '}
        <code>EventSource</code> at a time, exponential backoff with jitter, resume
        via <code>?lastEventId=</code>, dedupe of replayed ids, pause while the tab is
        hidden, teardown on close/unmount. The fake server emits a numbered{' '}
        <code>step</code> event every 800ms and drops the connection after every 7;
        on reconnect it replays from the requested id inclusive, so one duplicate
        arrives and must not appear in the list. Watch the server log on the right
        versus the hook&apos;s list on the left. This demo replaces{' '}
        <code>window.EventSource</code> only while it is mounted and restores the
        original on unmount.
      </p>
      <div className="demo-stage">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <section aria-label="Hook state">
            {installed ? (
              <StreamPanel key={runKey} onRestart={restart} />
            ) : (
              <p>Installing fake EventSource…</p>
            )}
          </section>
          <section aria-label="Fake server log">
            <h3 style={{ marginTop: 0 }}>Fake server log</h3>
            <pre
              style={{
                fontSize: '0.75rem',
                maxHeight: '22rem',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {log.join('\n')}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

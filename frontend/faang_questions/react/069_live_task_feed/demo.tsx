import { useCallback, useRef, useState } from 'react';
import {
  LiveTaskFeed,
  type AnnotationTask,
  type FeedEvent,
  type FeedHandlers,
  type TaskStatus,
} from './live_task_feed';

/**
 * Demo harness for LiveTaskFeed — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is live_task_feed.test.tsx.
 */

const STATUSES: TaskStatus[] = ['queued', 'in_review', 'approved', 'rejected'];
const TITLES = [
  'Label pedestrians — batch 12',
  'Bounding boxes — night drive 3',
  'Segment lane markings — set B',
  'Verify traffic lights — batch 7',
];

/**
 * Fake feed server. Emits one upsert every ~700ms, cycling each task through
 * the statuses, drops the connection roughly every 8 events to exercise the
 * reconnect path, and replays from `since` on reconnect — deliberately
 * re-sending the last applied seq once so a correct client proves it is
 * idempotent.
 */
class FakeFeedServer {
  private log: FeedEvent[] = [];
  private tasks: AnnotationTask[] = TITLES.map((title, i) => ({
    id: `task-${i + 1}`,
    title,
    status: 'queued',
    version: 1,
  }));
  private seq = 0;
  private sentOnConnection = 0;

  constructor(private onLog: (line: string) => void) {}

  connect(since: number, handlers: FeedHandlers) {
    let open = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    this.sentOnConnection = 0;
    this.onLog(`connect(since=${since})`);

    // Replay: everything after `since`, plus the event at `since` itself as a duplicate.
    const replay = this.log.filter((e) => e.seq >= Math.max(since, 1) && since > 0);
    if (replay.length > 0) {
      this.onLog(`replaying ${replay.length} event(s), first is a duplicate (seq ${replay[0].seq})`);
    }
    replay.forEach((e) => handlers.onEvent(e));

    const tick = () => {
      if (!open) return;
      // Every ~8 events, drop the connection.
      if (this.sentOnConnection >= 8) {
        open = false;
        this.onLog('server dropped connection');
        handlers.onClose();
        return;
      }
      const event = this.nextEvent();
      this.sentOnConnection += 1;
      handlers.onEvent(event);
      timer = setTimeout(tick, 700);
    };
    timer = setTimeout(tick, 700);

    return {
      close: () => {
        open = false;
        if (timer) clearTimeout(timer);
        this.onLog('client closed connection');
      },
    };
  }

  private nextEvent(): FeedEvent {
    const task = this.tasks[this.seq % this.tasks.length];
    const nextStatus = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length];
    const updated: AnnotationTask = { ...task, status: nextStatus, version: task.version + 1 };
    this.tasks = this.tasks.map((t) => (t.id === task.id ? updated : t));
    this.seq += 1;
    const event: FeedEvent = { seq: this.seq, type: 'task_upserted', task: updated };
    this.log.push(event);
    return event;
  }
}

export default function Demo() {
  const [runKey, setRunKey] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const server = useRef<FakeFeedServer | null>(null);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-11), line]);
  }, []);

  if (server.current === null) {
    server.current = new FakeFeedServer(appendLog);
  }

  const connect = useCallback(
    (since: number, handlers: FeedHandlers) => server.current!.connect(since, handlers),
    []
  );

  const restart = () => {
    server.current = new FakeFeedServer(appendLog);
    setLog([]);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Live Task Feed</h2>
      <p className="demo-note">
        Implement <code>LiveTaskFeed</code> in <code>live_task_feed.tsx</code> — an
        idempotent, version-ordered projection of a WebSocket event stream with
        exponential reconnect backoff. The fake server emits an upsert every
        700ms, drops the socket every ~8 events, and replays from{' '}
        <code>since</code> on reconnect (including one duplicate seq). A correct
        client shows exactly four rows and no status regressions.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={restart}>Restart feed</button>
        </div>
        <LiveTaskFeed key={runKey} connect={connect} reconnectMs={1000} maxReconnectMs={8000} />
        <pre className="demo-log" aria-label="Server log">
          {log.join('\n')}
        </pre>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';

export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface StreamEvent {
  /** The event's `lastEventId`, or `null` when the server sent none. */
  id: string | null;
  /** Event type: `'message'` or one of `options.eventTypes`. */
  type: string;
  data: string;
}

export interface UseEventStreamOptions {
  /** First retry delay in ms. Default 1000. */
  baseMs?: number;
  /** Upper bound on the retry delay in ms. Default 30000. */
  maxMs?: number;
  /** Returns a number in [0, 1). Default `Math.random`. */
  jitter?: () => number;
  /** Named event types to subscribe to in addition to `message`. */
  eventTypes?: string[];
}

export interface EventStreamState {
  status: StreamStatus;
  events: StreamEvent[];
  lastEventId: string | null;
  /** Closes the connection, cancels any pending reconnect and makes the hook inert. */
  close: () => void;
}

interface Connection {
  source: EventSource | null;
  detach: (() => void) | null;
  timer: ReturnType<typeof setTimeout> | null;
  attempt: number;
  waiting: boolean;
  closed: boolean;
  seen: Set<string>;
  lastEventId: string | null;
}

function withLastEventId(url: string, id: string | null): string {
  if (id === null) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}lastEventId=${encodeURIComponent(id)}`;
}

export function useEventStream(
  url: string,
  options?: UseEventStreamOptions,
): EventStreamState {
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const conn = useRef<Connection>({
    source: null,
    detach: null,
    timer: null,
    attempt: 0,
    waiting: false,
    closed: false,
    seen: new Set(),
    lastEventId: null,
  });

  useEffect(() => {
    const c: Connection = {
      source: null,
      detach: null,
      timer: null,
      attempt: 0,
      waiting: false,
      closed: false,
      seen: new Set(),
      lastEventId: null,
    };
    conn.current = c;

    const clearTimer = () => {
      if (c.timer !== null) clearTimeout(c.timer);
      c.timer = null;
    };

    const dropSource = () => {
      c.detach?.();
      c.detach = null;
      c.source?.close();
      c.source = null;
    };

    const connect = () => {
      if (c.closed) return;
      clearTimer();
      c.waiting = false;

      const source = new EventSource(withLastEventId(url, c.lastEventId));
      const { eventTypes = [] } = optionsRef?.current || {};

      const onOpen = () => {
        if (c.closed || c.source !== source) return;
        c.attempt = 0;
        setStatus('open');
      };

      const onMessage = (raw: Event) => {
        if (c.closed || c.source !== source) return;
        const event = raw as MessageEvent<string>;
        const id = event.lastEventId === '' ? null : event.lastEventId;
        if (id !== null) {
          if (c.seen.has(id)) return;
          c.seen.add(id);
          c.lastEventId = id;
          setLastEventId(id);
        }

        setEvents((prev) => [
          ...prev,
          { id, type: event.type, data: event.data },
        ]);
      };

      const onError = () => {
        if (c.closed || c.source !== source) return;
        dropSource();
        c.waiting = true;
        setStatus('reconnecting');
        if (document.visibilityState === 'hidden') return;
        scheduleReconnect();
      };

      const types = ['message', ...eventTypes];
      source.addEventListener('open', onOpen);
      source.addEventListener('error', onError);
      types.forEach((type) => source.addEventListener(type, onMessage));

      c.source = source;
      c.detach = () => {
        source.removeEventListener('open', onOpen);
        source.removeEventListener('error', onError);
        types.forEach((type) => source.removeEventListener(type, onMessage));
      };

      setStatus('connecting');
    };

    const scheduleReconnect = () => {
      const {
        baseMs = 1000,
        maxMs = 30000,
        jitter = Math.random,
      } = optionsRef.current || {};
      const delay = Math.min(
        maxMs,
        baseMs * 2 ** c.attempt + jitter() * baseMs,
      );
      c.attempt += 1;
      clearTimer();
      c.timer = setTimeout(connect, delay);
    };

    const onVisibility = () => {
      if (c.closed) return;
      if (document.visibilityState === 'hidden') {
        clearTimer();
      } else if (c.waiting && c.source === null) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    connect();

    return () => {
      c.closed = true;
      clearTimer();
      dropSource();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [url]);

  const close = useCallback(() => {
    const c = conn.current;
    if (!c || c.closed) return;
    c.closed = true;
    if (c.timer !== null) clearTimeout(c.timer);
    c.timer = null;
    c.detach?.();
    c.detach = null;
    c.source?.close();
    c.source = null;
    setStatus('closed');
  }, []);

  return { status, events, lastEventId, close };
}

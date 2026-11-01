/**
 * Minimal EventSource double for jsdom tests. Install with `installFakeEventSource()`
 * in beforeEach and restore in afterEach. Every construction is recorded in
 * `FakeEventSource.instances` so tests can drive the latest connection.
 */
type Listener = (event: MessageEvent | Event) => void;

export class FakeEventSource {
  static instances: FakeEventSource[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly url: string;
  readonly withCredentials: boolean;
  readyState = FakeEventSource.CONNECTING;
  onopen: Listener | null = null;
  onmessage: Listener | null = null;
  onerror: Listener | null = null;
  private listeners = new Map<string, Set<Listener>>();

  constructor(url: string | URL, init?: { withCredentials?: boolean }) {
    this.url = String(url);
    this.withCredentials = Boolean(init?.withCredentials);
    FakeEventSource.instances.push(this);
  }

  static get latest(): FakeEventSource {
    const last = FakeEventSource.instances[FakeEventSource.instances.length - 1];
    if (!last) throw new Error('No FakeEventSource has been constructed');
    return last;
  }

  static reset(): void {
    FakeEventSource.instances = [];
  }

  addEventListener(type: string, listener: Listener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED;
  }

  /** Server accepted the connection. */
  open(): void {
    this.readyState = FakeEventSource.OPEN;
    this.dispatch('open', new Event('open'));
  }

  /** Server sent an event. `type` defaults to 'message'. */
  emit(data: string, opts: { type?: string; lastEventId?: string } = {}): void {
    const type = opts.type ?? 'message';
    const event = new MessageEvent(type, { data, lastEventId: opts.lastEventId ?? '' });
    this.dispatch(type, event);
  }

  /** Connection dropped. Real EventSource moves to CONNECTING and retries by itself;
   *  the fake just reports the error and lets the hook decide. */
  error(): void {
    this.readyState = FakeEventSource.CLOSED;
    this.dispatch('error', new Event('error'));
  }

  private dispatch(type: string, event: MessageEvent | Event): void {
    if (this.readyState === FakeEventSource.CLOSED && type !== 'error') return;
    const handler = (this as unknown as Record<string, Listener | null>)[`on${type}`];
    handler?.(event);
    this.listeners.get(type)?.forEach((l) => l(event));
  }
}

let original: unknown;

export function installFakeEventSource(): void {
  original = (globalThis as Record<string, unknown>).EventSource;
  (globalThis as Record<string, unknown>).EventSource = FakeEventSource;
  FakeEventSource.reset();
}

export function restoreEventSource(): void {
  (globalThis as Record<string, unknown>).EventSource = original;
  FakeEventSource.reset();
}

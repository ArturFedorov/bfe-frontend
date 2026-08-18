import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
}

export type LogLevel = 'info' | 'error';

export interface LogEntry {
  requestId: string | undefined;
  level: LogLevel;
  message: string;
}

export type LogSink = (entry: LogEntry) => void;

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

// One module-level storage instance — see README requirements.
const storage = new AsyncLocalStorage<RequestContext>();
void storage;

/**
 * Runs `fn` inside an async context carrying `requestId`. The id is visible
 * via getRequestId() anywhere down the async call chain of `fn` — awaits,
 * timers, microtasks — and never bleeds into other concurrent contexts.
 */
export function runWithContext<T>(requestId: string, fn: () => Promise<T> | T): Promise<T> {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Current context's request id, or undefined outside any context. Never throws. */
export function getRequestId(): string | undefined {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Structured logger bound to a sink. The requestId is read from the ambient
 * async context at CALL time — not captured when the logger is created — so
 * one shared logger instance serves every request correctly.
 */
export function createLogger(sink: LogSink): Logger {
  // TODO: implement
  throw new Error('Not implemented');
}

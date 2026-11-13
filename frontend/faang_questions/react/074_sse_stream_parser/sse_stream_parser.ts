export interface SSEMessage {
  /** Event type; `'message'` when the block had no `event:` line. */
  event: string;
  /** All `data:` lines of the block joined with `\n`. */
  data: string;
  /** Last-Event-ID in effect for this message; persists across blocks until changed. */
  id: string | null;
  /** Integer value of a valid `retry:` line in this block, otherwise `null`. */
  retry: number | null;
}

export interface ParseSSEOptions {
  /** Aborting cancels the reader, releases its lock and ends the iteration. */
  signal?: AbortSignal;
}

export function parseSSE(
  stream: ReadableStream<Uint8Array>,
  options?: ParseSSEOptions,
): AsyncIterable<SSEMessage> {
  void stream;
  void options;
  throw new Error('Not implemented');
}

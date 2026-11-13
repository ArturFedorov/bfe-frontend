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

export function useEventStream(
  url: string,
  options?: UseEventStreamOptions,
): EventStreamState {
  void url;
  void options;
  throw new Error('Not implemented');
}

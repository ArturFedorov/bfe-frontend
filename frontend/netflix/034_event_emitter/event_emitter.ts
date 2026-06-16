type Listener = (...args: unknown[]) => void;

/**
 * A Node-style EventEmitter. Support on / off / once / emit.
 * Tricky case: calling `off` (or `once` self-removal) during an `emit` must not
 * disturb the current dispatch — iterate over a snapshot of listeners.
 */
export class EventEmitter {
  on(event: string, listener: Listener): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  off(event: string, listener: Listener): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  once(event: string, listener: Listener): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  emit(event: string, ...args: unknown[]): boolean {
    // TODO: implement (return true if any listener fired)
    throw new Error('Not implemented');
  }
}

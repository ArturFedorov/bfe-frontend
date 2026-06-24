type Listener = (...args: unknown[]) => void;

/**
 * A Node-style EventEmitter. Support on / off / once / emit.
 * Tricky case: calling `off` (or `once` self-removal) during an `emit` must not
 * disturb the current dispatch — iterate over a snapshot of listeners.
 */
export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): this {
    const listeners = this.listeners.get(event) || new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);

    return this;
  }

  off(event: string, listener: Listener): this {
    const listeners = this.listeners.get(event);
    if(!listeners) return this;

    if(listeners.has(listener)) {
      listeners.delete(listener);
      return this;
    }

    for(const l of listeners) {
      if((l as any)._original === listener) {
        listeners.delete(l);
        return this;
      }
    }

    return this;
  }

  once(event: string, listener: Listener): this {
    const wrapper: Listener = (...args: unknown[]) => {
      this.off(event, wrapper);
      listener(...args);
    }

    (wrapper as any)._original = listener;
    return this.on(event, wrapper);
  }

  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this.listeners.get(event);

    if(!listeners || listeners.size === 0) return false;

    for(const listener of [...listeners]) {
      listener(...args);
    }

    return true;
  }
}

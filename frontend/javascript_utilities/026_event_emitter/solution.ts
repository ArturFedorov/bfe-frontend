type Listener = (...args: any[]) => void;

/**
 * Minimal observer-pattern EventEmitter.
 *
 * Listeners for each event live in an array (insertion order == call order).
 *
 * - `off` removes only the first matching reference, like Node's emitter.
 *   It also understands the original callback passed to `once`, because the
 *   `once` wrapper records it on `wrapper.original`.
 * - `once` wraps the listener in a self-removing function, removing itself
 *   BEFORE invoking the callback so a re-entrant `emit` can't fire it twice.
 * - `emit` iterates over a snapshot of the listener list, so listeners that
 *   add/remove listeners during dispatch don't affect the current dispatch.
 */
export class EventEmitter {
  private listeners = new Map<
    string,
    Array<Listener & { original?: Listener }>
  >();

  on(event: string, listener: Listener): this {
    const list = this.listeners.get(event);
    if (list) {
      list.push(listener);
    } else {
      this.listeners.set(event, [listener]);
    }
    return this;
  }

  off(event: string, listener: Listener): this {
    const list = this.listeners.get(event);
    if (!list) return this;

    const index = list.findIndex(
      (l) => l === listener || l.original === listener,
    );
    if (index !== -1) {
      list.splice(index, 1);
      if (list.length === 0) this.listeners.delete(event);
    }
    return this;
  }

  once(event: string, listener: Listener): this {
    const wrapper: Listener & { original?: Listener } = (...args) => {
      this.off(event, wrapper);
      listener(...args);
    };
    wrapper.original = listener;
    return this.on(event, wrapper);
  }

  emit(event: string, ...args: any[]): boolean {
    const list = this.listeners.get(event);
    if (!list || list.length === 0) return false;

    // Snapshot so mutations during dispatch don't skip or double-fire listeners.
    for (const listener of [...list]) {
      listener(...args);
    }
    return true;
  }
}

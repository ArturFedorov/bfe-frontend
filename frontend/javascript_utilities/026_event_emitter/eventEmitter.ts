type Listener = (...args: any[]) => void;

export class EventEmitter {
  private eventStore = new Map<string, Listener[]>();

  on(event: string, listener: Listener): this {
    const registered = this.eventStore.get(event) ?? [];
    registered.push(listener);
    this.eventStore.set(event, registered);

    return this;
  }

  off(event: string, listener: Listener): this {
    const listeners = this.eventStore.get(event);

    if (listeners && listeners.length > 0) {
      const filtered = listeners.filter((l) => l !== listener);
      this.eventStore.set(event, filtered);
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
    const list = this.eventStore.get(event);
    if (!list || list.length === 0) return false;

    for (const listener of list) {
      listener(...args);
    }
    return true;
  }
}

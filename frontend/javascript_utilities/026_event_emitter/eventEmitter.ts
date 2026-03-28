export class EventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    const handlers = this.listeners.get(event);
    if (!handlers) return this;

    this.listeners.set(
      event,
      handlers.filter((h) => h !== listener),
    );
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    const wrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, wrapper);
    };

    return this.on(event, wrapper);
  }

  emit(event: string, ...args: any[]): boolean {
    const handlers = this.listeners.get(event);
    if (!handlers) return false;

    [...handlers].forEach((handler) => handler(...args));

    return true;
  }
}

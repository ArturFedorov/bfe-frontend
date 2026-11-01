/**
 * A type-safe EventEmitter. Given an event map (event name -> payload type),
 * `on` and `emit` must enforce the correct payload type per event.
 *
 * Example: new TypedEmitter<{ click: { x: number } }>()
 */
export class TypedEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    const items = this.listeners.get(event) || new Set<typeof listener>();
    items.add(listener);
    this.listeners.set(event, items);
    return this;
  }

  off<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    const items = this.listeners.get(event);
    if (!items) return this;

    items.delete(listener);
    this.listeners.set(event, items);
    return this;
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
    const items = this.listeners.get(event);

    if (!items || items.size === 0) return false;

    for (const item of [...items]) {
      item(payload);
    }

    return true;
  }
}

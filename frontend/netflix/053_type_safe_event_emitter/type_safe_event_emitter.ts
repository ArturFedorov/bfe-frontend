/**
 * A type-safe EventEmitter. Given an event map (event name -> payload type),
 * `on` and `emit` must enforce the correct payload type per event.
 *
 * Example: new TypedEmitter<{ click: { x: number } }>()
 */
export class TypedEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  off<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void,
  ): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
    // TODO: implement (return true if any listener fired)
    throw new Error('Not implemented');
  }
}

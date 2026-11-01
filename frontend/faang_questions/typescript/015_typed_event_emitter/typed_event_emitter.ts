// Event → payload map for the integrations console (given).
export type IntegrationEvents = {
  'partner:connected': { partnerId: string; at: number };
  'partner:disconnected': { partnerId: string; reason: string };
  'report:ready': { reportId: string; rows: number };
};

// TODO: design the method types. For an event name E from the Events map,
// on/off/once handlers must receive exactly Events[E], and emit must require
// exactly Events[E] as payload. Unknown event names must not compile.
// The `any`s below are the task. Then implement on/off/once/emit at runtime.
export class TypedEmitter<Events> {
  on(event: any, handler: any): void {
    throw new Error('Not implemented');
  }

  off(event: any, handler: any): void {
    throw new Error('Not implemented');
  }

  once(event: any, handler: any): void {
    throw new Error('Not implemented');
  }

  emit(event: any, payload: any): void {
    throw new Error('Not implemented');
  }
}

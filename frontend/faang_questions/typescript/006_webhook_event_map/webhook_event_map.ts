export type WebhookEvent =
  | { type: 'delivery.created'; deliveryId: string; partnerId: string }
  | { type: 'delivery.failed'; deliveryId: string; errorCode: number }
  | { type: 'partner.linked'; partnerId: string; linkedBy: string };

export type WebhookEventType = any; // TODO: the discriminant union, derived from WebhookEvent

export type EventOfType<T extends WebhookEventType> = any; // TODO: one variant, via Extract

// TODO: replace with a mapped type — one required handler per event type,
// each parameter typed as exactly its event variant
export type HandlerRegistry = Record<string, (event: any) => void>;

export function dispatchEvent(
  registry: HandlerRegistry,
  event: WebhookEvent,
): void {
  // TODO: implement — route the event to its handler, no casts
  throw new Error('Not implemented');
}

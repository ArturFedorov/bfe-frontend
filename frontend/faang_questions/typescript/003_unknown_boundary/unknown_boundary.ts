export interface WebhookAsset {
  id: string;
  sizeBytes: number;
}

export interface DeliveryWebhook {
  event: 'delivery.completed';
  deliveryId: string;
  partnerId: string;
  assets: WebhookAsset[];
}

// TODO: the return type must be a type predicate for Record<string, unknown>
export function isRecord(value: unknown): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

export function parseDeliveryWebhook(payload: unknown): DeliveryWebhook {
  // TODO: implement — narrowing only, zero casts, errors carry the field path
  throw new Error('Not implemented');
}

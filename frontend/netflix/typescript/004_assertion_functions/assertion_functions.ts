export type DeliveryStatus =
  | { state: 'queued'; position: number }
  | { state: 'in_transit'; carrier: string }
  | { state: 'delivered'; deliveredAt: string; receipt: string }
  | { state: 'failed'; reason: string };

export type Delivered = any; // TODO: derive the delivered variant from the union

// TODO: the return type must be an asserts annotation, not void
export function assertDelivered(status: DeliveryStatus): void {
  // TODO: implement
  throw new Error('Not implemented');
}

// TODO: the return type must be a generic asserts annotation, not void
export function assertPresent<T>(value: T | null | undefined, label: string): void {
  // TODO: implement
  throw new Error('Not implemented');
}

export function getReceipt(status: DeliveryStatus): string {
  // TODO: implement — assertDelivered, then return the receipt (no casts)
  throw new Error('Not implemented');
}

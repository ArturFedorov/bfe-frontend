export interface RetryConfig {
  retry?: {
    attempts: number;
    backoffMs: number;
  };
}

export type Payload = { text: string } | { blob: Uint8Array };

export type DeliveryResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function shouldAlert(config: RetryConfig): boolean {
  // TODO: implement — see the broken original in the README
  throw new Error('Not implemented');
}

export function payloadSize(payload: Payload): number {
  // TODO: implement — see the broken original in the README
  throw new Error('Not implemented');
}

export function sumDefined(values: (number | undefined)[]): number {
  // TODO: implement — see the broken original in the README
  throw new Error('Not implemented');
}

export function unwrap(result: DeliveryResult): number {
  // TODO: implement — see the broken original in the README
  throw new Error('Not implemented');
}

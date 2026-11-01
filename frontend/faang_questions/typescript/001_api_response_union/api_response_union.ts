export interface Integration {
  id: string;
  partner: string;
  healthy: boolean;
}

// TODO: design the three variants — 'loading' (no other fields),
// 'success' (integrations: Integration[], fetchedAt: string),
// 'error' (code: number, message: string) — discriminated on `status`.
export type LoadingResponse = any; // TODO: design this type
export type SuccessResponse = any; // TODO: design this type
export type ErrorResponse = any; // TODO: design this type

export type IntegrationStatusResponse = any; // TODO: union of the three variants

export function assertNever(value: never): never {
  throw new Error(`Unexpected variant: ${JSON.stringify(value)}`);
}

export function describeResponse(res: IntegrationStatusResponse): string {
  // TODO: implement — exhaustive switch on res.status with assertNever in default
  throw new Error('Not implemented');
}

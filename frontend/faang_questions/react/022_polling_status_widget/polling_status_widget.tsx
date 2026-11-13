import type { ReactNode } from 'react';

export type IngestionStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export const TERMINAL_STATUSES: IngestionStatus[] = ['succeeded', 'failed'];

export interface PollingStatusWidgetProps {
  fetchStatus: () => Promise<IngestionStatus>;
  intervalMs?: number;
  maxIntervalMs?: number;
}

export function PollingStatusWidget({
  fetchStatus,
  intervalMs = 5000,
  maxIntervalMs = 60000,
}: PollingStatusWidgetProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}

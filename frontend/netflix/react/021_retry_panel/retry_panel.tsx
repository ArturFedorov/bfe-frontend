import type { ReactNode } from 'react';

export interface RetryPanelProps {
  runCheck: () => Promise<string>;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

export function RetryPanel({
  runCheck,
  initialDelayMs = 5000,
  backoffFactor = 2,
  maxDelayMs = 60000,
}: RetryPanelProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}

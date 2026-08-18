import type { ReactElement } from 'react';

export interface LastUpdatedClockProps {
  /** Epoch milliseconds of the last successful refresh. */
  updatedAt: number;
  /** How often to re-render the elapsed time. Defaults to 1000 ms. */
  tickMs?: number;
}

export function LastUpdatedClock({
  updatedAt,
  tickMs = 1000,
}: LastUpdatedClockProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

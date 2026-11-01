import type { ReactElement } from 'react';

/**
 * Returns the value from the previous render (undefined on the first render).
 * Stored in a ref so remembering it never causes an extra render.
 */
export function usePrevious<T>(value: T): T | undefined {
  // TODO: implement
  throw new Error('Not implemented');
}

export interface MetricDeltaProps {
  /** Metric name, e.g. 'Assets delivered'. */
  label: string;
  /** Current metric value pushed by the polling layer. */
  value: number;
}

export function MetricDelta({ label, value }: MetricDeltaProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

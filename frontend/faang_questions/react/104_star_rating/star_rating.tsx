import type { ReactElement } from 'react';

export interface StarRatingProps {
  /** Accessible name of the radiogroup / read-only image. */
  label: string;
  /** Controlled rating. */
  value?: number;
  /** Uncontrolled start value. Default 0. */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Number of stars. Default 5. */
  max?: number;
  /** Allow 0.5 steps (keyboard and pointer position). Default false. */
  allowHalf?: boolean;
  /** Clicking the already-selected star resets to 0. Default true. */
  allowClear?: boolean;
  /** Render a single labelled image with no interaction. Default false. */
  readOnly?: boolean;
}

export type StarFill = 'full' | 'half' | 'empty';

/**
 * Clamps to [0, max]; rounds to the nearest 0.5 when allowHalf, else to the
 * nearest integer; NaN -> 0.
 */
export function clampRating(v: number, max: number, allowHalf: boolean): number {
  throw new Error('Not implemented');
}

export function StarRating(props: StarRatingProps): ReactElement {
  throw new Error('Not implemented');
}

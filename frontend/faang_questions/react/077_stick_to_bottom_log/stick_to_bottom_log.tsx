import { ReactElement } from 'react';

export interface StickToBottomLogProps {
  /** Transcript lines, append-only while a run streams. */
  lines: string[];
  /** True while the producer is still emitting; reflected as `aria-busy` on the log. */
  streaming: boolean;
  /** Distance (px) from the bottom that still counts as "at the bottom". Default 16. */
  threshold?: number;
  /** Fires only when following flips (never on mount). */
  onFollowChange?: (following: boolean) => void;
}

export function StickToBottomLog(_props: StickToBottomLogProps): ReactElement {
  throw new Error('Not implemented');
}

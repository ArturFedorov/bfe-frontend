import { ReactElement } from 'react';

export interface Suggestion {
  id: string;
  label: string;
  /** The span of text the label applies to. */
  text: string;
  /** 0..1 */
  confidence: number;
  /** Version of the source text these offsets were computed against. */
  textVersion: number;
}

export interface SuggestionsPanelProps {
  suggestions: readonly Suggestion[];
  /** Current version of the source text; suggestions for other versions are stale. */
  textVersion: number;
  /** One call per user decision; accept-all passes every visible id in one call. */
  onAccept: (ids: string[]) => void;
  onReject: (id: string) => void;
}

export const DEFAULT_THRESHOLD = 0.5;

/**
 * Pure filter: keeps order, keeps only suggestions whose `textVersion` matches
 * and whose `confidence >= threshold`.
 */
export function filterSuggestions(
  suggestions: readonly Suggestion[],
  textVersion: number,
  threshold: number,
): Suggestion[] {
  throw new Error('Not implemented');
}

export function SuggestionsPanel(props: SuggestionsPanelProps): ReactElement {
  throw new Error('Not implemented');
}

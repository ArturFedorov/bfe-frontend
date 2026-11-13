import type { ReactElement } from 'react';

export interface LabelOption {
  /** Single digit '1'-'9' */
  key: string;
  name: string;
}

export interface LabelItem {
  id: string;
  text: string;
}

/** itemId -> label key */
export type Assignments = Record<string, string | undefined>;

export interface LabelHotkeysProps {
  items: LabelItem[];
  labels: LabelOption[];
  value: Assignments;
  onChange: (next: Assignments) => void;
}

export function LabelHotkeys({ items, labels, value, onChange }: LabelHotkeysProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

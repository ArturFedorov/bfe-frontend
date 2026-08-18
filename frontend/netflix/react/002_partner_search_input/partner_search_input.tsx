import type { ReactElement } from 'react';

export interface PartnerSearchInputProps {
  /** Current query — the parent owns this state. */
  value: string;
  /** Called with the next value on every edit (typing, clearing). */
  onChange: (nextValue: string) => void;
  /** Visible label text. Defaults to 'Search partners'. */
  label?: string;
  /** Maximum number of characters, enforced natively. Defaults to 50. */
  maxLength?: number;
}

export function PartnerSearchInput({
  value,
  onChange,
  label = 'Search partners',
  maxLength = 50,
}: PartnerSearchInputProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

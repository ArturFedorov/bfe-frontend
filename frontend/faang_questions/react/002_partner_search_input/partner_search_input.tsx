import {ChangeEvent, ReactElement, useCallback, useId, useMemo} from 'react';

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

const DEFAULT_MAX_LENGTH = 50;

export function PartnerSearchInput({
  value,
  onChange,
  label = 'Search partners',
  maxLength = DEFAULT_MAX_LENGTH,
}: PartnerSearchInputProps): ReactElement {
  const id = useId();

  const safeMaxLength =
    Number.isInteger(maxLength) && maxLength > 0 ? maxLength : DEFAULT_MAX_LENGTH;

  const counter = `${value.length} / ${safeMaxLength}`;

  return (
    <div>
      <label htmlFor={id}>{ label }</label>
      <input id={id} type="search" maxLength={safeMaxLength} value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{counter}</span>
      { value.length > 0 && <button type="button" onClick={() => onChange('')}>Clear search</button>}
    </div>
  )
}

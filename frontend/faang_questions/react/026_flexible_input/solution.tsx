import { ReactElement, useEffect, useId, useRef, useState } from 'react';

export type FlexibleInputProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

/**
 * Input that works in both controlled (`value`) and uncontrolled
 * (`defaultValue`) mode, mirroring React's own `<input>` contract.
 *
 * Design notes:
 * - The mode is latched on the FIRST render (`isControlledRef`). Deciding per
 *   render would make `value={maybeUndefined}` silently flip between modes,
 *   losing whoever's state is not currently "winning".
 * - The inner `<input>` is ALWAYS rendered controlled (we always pass `value`
 *   and `onChange`), so React never emits its own controlled/uncontrolled
 *   warning — we own that diagnostic and emit it exactly once per instance.
 * - `onChange` receives the plain string, not the event.
 */
export function FlexibleInput({
  label,
  value,
  defaultValue,
  onChange,
}: FlexibleInputProps): ReactElement {
  const id = useId();

  // Latch the mode from the first render.
  const isControlledRef = useRef(value !== undefined);
  const isControlled = isControlledRef.current;

  // Internal state is only authoritative in uncontrolled mode; the lazy
  // initializer runs once, so later `defaultValue` changes are ignored.
  const [internalValue, setInternalValue] = useState(() => defaultValue ?? '');

  // Warn once if the caller switches modes mid-lifetime.
  const warnedRef = useRef(false);
  const isControlledNow = value !== undefined;
  useEffect(() => {
    if (warnedRef.current || isControlledNow === isControlled) return;
    warnedRef.current = true;
    const from = isControlled ? 'controlled' : 'uncontrolled';
    const to = isControlledNow ? 'controlled' : 'uncontrolled';
    console.warn(
      `FlexibleInput is changing from ${from} to ${to}. ` +
        'Decide between controlled and uncontrolled for the lifetime of the component.',
    );
  }, [isControlled, isControlledNow]);

  // Controlled: display the prop (falling back to internal state if the parent
  // wrongly drops `value` later). Uncontrolled: display our own state.
  const displayValue = isControlled ? (value ?? internalValue) : internalValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={displayValue} onChange={handleChange} />
    </div>
  );
}

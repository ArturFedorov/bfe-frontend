import {ReactNode, useCallback, useEffect, useId, useRef, useState} from 'react';

export interface OptimisticToggleProps {
  label: string;
  initialEnabled: boolean;
  updateFlag: (enabled: boolean) => Promise<void>;
}

export function OptimisticToggle({
  label,
  initialEnabled,
  updateFlag,
}: OptimisticToggleProps): ReactNode {
  const id = useId();
  const [showError, setShowError] = useState<boolean>(false);
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);

  const inFlightRef = useRef(false);

  const toggleValue = async () => {
    if(inFlightRef.current) return;
    inFlightRef.current = true;

    const previous = enabled;
    const next = !previous;

    setEnabled(next);
    setShowError(false);

    try {
      await updateFlag(next);
    } catch {
      setEnabled(previous)
      setShowError(true);
    } finally {
      inFlightRef.current = false;
    }
  }

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-checked={enabled}
        checked={enabled}
        role="switch"
        type="checkbox"
        onChange={toggleValue}
      />
      {showError && <div role="alert">{`Could not update ${label}`}</div>}
    </div>
  )
}

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, ms: number): T {
  let [updatedValue, setUpdatedValue] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setUpdatedValue(value);
    }, ms);

    return () => {
      clearTimeout(id);
    };
  }, [value]);

  return updatedValue;
}

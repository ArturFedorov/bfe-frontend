import { useEffect, useState } from 'react';

/**
 * Trailing-edge debounce of any value.
 *
 * The whole algorithm is the effect + its cleanup:
 *  - every render where `value` (or `ms`) changed arms a fresh timer, and
 *  - React runs the previous run's cleanup first, which clears the previous
 *    timer — so rapid changes keep cancelling each other and only the last
 *    one survives `ms` of silence.
 *  - on unmount the same cleanup clears the pending timer, so nothing leaks
 *    and nothing calls setState after unmount.
 *
 * `useState(value)` makes the first render return `value` immediately with
 * no initial delay. No ref is needed for the trailing-only variant; a
 * leading-edge variant would need one to remember "did we already fire
 * for this burst".
 */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debounced;
}

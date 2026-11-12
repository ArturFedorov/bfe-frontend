import type { ReactElement, ReactNode } from 'react';

export type Flags = Record<string, boolean>;

export const OVERRIDES_STORAGE_KEY = 'flag-overrides';

export interface FlagsProviderProps {
  /** Server-provided flags. Replacing the object propagates to consumers. */
  flags: Flags;
  /** Where overrides are persisted (e.g. `window.localStorage`). In-memory when omitted. */
  storage?: Storage;
  children: ReactNode;
}

export interface FlagOverrideApi {
  /** `null` clears the override for `name`. */
  set(name: string, value: boolean | null): void;
  overrides: Readonly<Flags>;
}

export interface FeatureProps {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FlagsProvider(props: FlagsProviderProps): ReactElement {
  throw new Error('Not implemented');
}

/** Effective value of one flag (override ?? provider flag ?? false). */
export function useFlag(name: string): boolean {
  throw new Error('Not implemented');
}

/** Select from the effective flag map; re-renders only when the selection changes. */
export function useFlags<T>(
  selector: (flags: Readonly<Flags>) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T {
  throw new Error('Not implemented');
}

export function useFlagOverride(): FlagOverrideApi {
  throw new Error('Not implemented');
}

export function Feature(props: FeatureProps): ReactElement | null {
  throw new Error('Not implemented');
}

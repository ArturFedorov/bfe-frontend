/**
 * Design tokens for the channel preview. Values are px numbers so they can be
 * used both in inline styles (React appends "px") and in arithmetic.
 */
export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

export const radius = { sm: 4, md: 8, lg: 12, full: 9999 } as const;

export const color = {
  surface: '#ffffff',
  surfaceMuted: '#f5f5f7',
  border: '#d2d2d7',
  text: '#1d1d1f',
  textMuted: '#6e6e73',
  accent: '#0071e3',
  accentText: '#ffffff',
} as const;

/** Preview frame width per channel, in px. */
export const channelWidth = { email: 600, push: 360, 'in-app': 320 } as const;

export type Channel = keyof typeof channelWidth;

export type ClassValue =
  | string
  | false
  | null
  | undefined
  | Record<string, boolean>;

/**
 * Joins class names: truthy strings and the keys of objects whose value is
 * `true`, separated by single spaces. Exact duplicates appear once (first
 * position wins). Returns '' when nothing is truthy.
 *
 * A `Set` gives both guarantees at once: insertion order is preserved and a
 * re-added key keeps its original position. Strings are treated as opaque
 * tokens — `'a b'` and `'a'` are *not* duplicates of each other; splitting on
 * whitespace (or resolving Tailwind conflicts) is a different, harder helper.
 */
export function cx(...parts: ClassValue[]): string {
  const classes = new Set<string>();
  for (const part of parts) {
    if (!part) continue; // false / null / undefined / ''
    if (typeof part === 'string') {
      classes.add(part);
      continue;
    }
    for (const [name, enabled] of Object.entries(part)) {
      if (enabled) classes.add(name);
    }
  }
  return Array.from(classes).join(' ');
}

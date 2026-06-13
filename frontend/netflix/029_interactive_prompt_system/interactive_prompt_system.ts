/**
 * Pure logic behind terminal prompts (decoupled from stdin for testability).
 *
 * - parseConfirm: interpret a typed answer with a default.
 *     '' -> default, 'y'/'yes' -> true, 'n'/'no' -> false (case-insensitive).
 * - applyKey: given current selection state for a single-select list and a key
 *     ('up' | 'down' | 'enter'), return the next state. `done` is set on enter.
 */
export function parseConfirm(input: string, defaultValue: boolean): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

export interface SelectState {
  index: number;
  length: number;
  done: boolean;
}

export function applyKey(
  state: SelectState,
  key: 'up' | 'down' | 'enter',
): SelectState {
  // TODO: implement (wrap around at the ends)
  throw new Error('Not implemented');
}

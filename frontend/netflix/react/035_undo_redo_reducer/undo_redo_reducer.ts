export interface HistoryState<S> {
  past: S[];
  present: S;
  future: S[];
}

export type HistoryAction<A> =
  | A
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'checkpoint' };

export function createHistoryState<S>(present: S): HistoryState<S> {
  // TODO: implement
  throw new Error('Not implemented');
}

export function canUndo<S>(state: HistoryState<S>): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

export function canRedo<S>(state: HistoryState<S>): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

export function withUndoRedo<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
): (state: HistoryState<S>, action: HistoryAction<A>) => HistoryState<S> {
  // TODO: implement — handle 'undo' | 'redo' | 'checkpoint' here, forward
  // everything else to the base reducer. Base-level no-ops (same reference)
  // must not create history entries.
  throw new Error('Not implemented');
}

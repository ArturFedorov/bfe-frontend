export interface UndoHistory<T> {
  past: T[];
  present: T;
  future: T[];
}

export type UndoSet<T> = (value: T | ((prev: T) => T)) => void;

export interface UseUndoStateResult<T> {
  state: T;
  set: UndoSet<T>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useUndoState<T>(initial: T): UseUndoStateResult<T> {
  // TODO: implement
  throw new Error('Not implemented');
}

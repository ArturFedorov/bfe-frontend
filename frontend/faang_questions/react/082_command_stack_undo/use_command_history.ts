export interface Command<T> {
  /** Human-readable name, e.g. "Add span", "Type". */
  label: string;
  do: (state: T) => T;
  undo: (state: T) => T;
  /**
   * Consecutive commands with the same (defined) mergeKey coalesce into one
   * history entry, e.g. 'typing' or 'drag'.
   */
  mergeKey?: string;
}

export interface CommandHistoryOptions {
  /** Maximum number of undoable entries kept. Oldest entries are dropped first. */
  limit?: number;
}

export interface CommandHistory<T> {
  state: T;
  execute: (command: Command<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Everything executed until the matching endBatch becomes a single entry. Nested batches flatten. */
  beginBatch: () => void;
  endBatch: () => void;
}

interface Entry<T> {
  do: (state: T) => T,
  undo: (state: T) => T,
  mergeKey?: string;
}

interface History<T> {
  present: T;
  past: Entry<T>[];
  future: Entry<T>[];
  mergeOpen: boolean;
}

function compose<T>(first: Entry<T>, second: Entry<T>, mergeKey?: string): Entry<T> {
  return {
    do: (s: T) => second.do(first.do(s)),
    undo: (s: T) => first.undo(second.undo(s)),
    mergeKey,
  }
}

export function useCommandHistory<T>(
  _initial: T,
  _options?: CommandHistoryOptions,
): CommandHistory<T> {
  throw new Error('Not implemented');
}

import { useCallback, useRef, useState } from 'react';

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
  do: (state: T) => T;
  undo: (state: T) => T;
  mergeKey?: string;
}

interface History<T> {
  present: T;
  past: Entry<T>[];
  future: Entry<T>[];
  mergeOpen: boolean;
}

function compose<T>(
  first: Entry<T>,
  second: Entry<T>,
  mergeKey?: string,
): Entry<T> {
  return {
    do: (s: T) => second.do(first.do(s)),
    undo: (s: T) => first.undo(second.undo(s)),
    mergeKey,
  };
}

function trim<T>(past: Entry<T>[], limit: number | undefined): Entry<T>[] {
  return limit !== undefined && past.length > limit
    ? past.slice(past.length - limit)
    : past;
}

export function useCommandHistory<T>(
  _initial: T,
  _options?: CommandHistoryOptions,
): CommandHistory<T> {
  const [history, setHistory] = useState<History<T>>({
    present: _initial,
    past: [],
    future: [],
    mergeOpen: false,
  });

  const limitRef = useRef(_options?.limit);
  limitRef.current = _options?.limit;

  const batchRef = useRef<{ depth: number; commands: Command<T>[] }>({
    depth: 0,
    commands: [],
  });

  const execute = useCallback((command: Command<T>) => {
    if (batchRef.current.depth > 0) {
      batchRef.current.commands.push(command);
      setHistory((h) => ({ ...h, present: command.do(h.present) }));
      return;
    }

    setHistory((h) => {
      const present = command.do(h.present);
      const top = h.past[h.past.length - 1];
      const canMerge =
        command.mergeKey !== undefined &&
        h.mergeOpen &&
        top !== undefined &&
        top.mergeKey === command.mergeKey;
      const entry: Entry<T> = {
        do: command.do,
        undo: command.undo,
        mergeKey: command.mergeKey,
      };
      const past = canMerge
        ? [...h.past.slice(0, -1), compose(top, entry, command.mergeKey)]
        : trim([...h.past, entry], limitRef.current);

      return {
        present,
        past,
        future: [],
        mergeOpen: true,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      const top = h.past[h.past.length - 1];
      if (!top) return h;
      return {
        present: top.undo(h.present),
        past: h.past.slice(0, -1),
        future: [top, ...h.future],
        mergeOpen: false,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      const [next, ...rest] = h.future;
      if (!next) return h;

      return {
        present: next.do(h.present),
        past: [...h.past, next],
        future: rest,
        mergeOpen: false,
      };
    });
  }, []);

  const beginBatch = useCallback(() => {
    batchRef.current.depth += 1;
  }, []);

  const endBatch = useCallback(() => {
    const batch = batchRef.current;
    if (batch.depth === 0) return;
    batch.depth -= 1;
    if (batch.depth > 0) return;
    const commands = batch.commands;
    batch.commands = [];
    if (commands.length === 0) return;

    const entry = commands
      .map<Entry<T>>((c) => ({ do: c.do, undo: c.undo }))
      .reduce((acc, e) => compose(acc, e));
    setHistory((h) => ({
      ...h,
      past: trim([...h.past, entry], limitRef.current),
      future: [],
      mergeOpen: false,
    }));
  }, []);

  return {
    state: history.present,
    execute,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    beginBatch,
    endBatch,
  };
}

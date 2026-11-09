/**
 * Reference solution for 082 — keep use_command_history.ts blank for redo
 * practice; this file is for comparison after your own attempt.
 */
import { useCallback, useRef, useState } from 'react';

export interface Command<T> {
  label: string;
  do: (state: T) => T;
  undo: (state: T) => T;
  mergeKey?: string;
}

export interface CommandHistoryOptions {
  limit?: number;
}

export interface CommandHistory<T> {
  state: T;
  execute: (command: Command<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  beginBatch: () => void;
  endBatch: () => void;
}

/** One undoable step. A merged run or a batch is still one entry. */
interface Entry<T> {
  do: (state: T) => T;
  undo: (state: T) => T;
  mergeKey?: string;
}

interface History<T> {
  present: T;
  past: Entry<T>[];
  future: Entry<T>[];
  /** False after undo/redo or a batch: the next command must start a new entry. */
  mergeOpen: boolean;
}

/** Compose two entries: do in order, undo in reverse. */
function compose<T>(first: Entry<T>, second: Entry<T>, mergeKey?: string): Entry<T> {
  return {
    do: (s) => second.do(first.do(s)),
    undo: (s) => first.undo(second.undo(s)),
    mergeKey,
  };
}

function trim<T>(past: Entry<T>[], limit: number | undefined): Entry<T>[] {
  return limit !== undefined && past.length > limit ? past.slice(past.length - limit) : past;
}

export function useCommandHistory<T>(initial: T, options: CommandHistoryOptions = {}): CommandHistory<T> {
  const [history, setHistory] = useState<History<T>>({ present: initial, past: [], future: [], mergeOpen: false });

  // Read through refs so every callback can have an empty dependency list.
  const limitRef = useRef(options.limit);
  limitRef.current = options.limit;
  // Batching is synchronous bookkeeping across several execute() calls in one
  // tick, so it lives in a ref, not in state.
  const batchRef = useRef<{ depth: number; commands: Command<T>[] }>({ depth: 0, commands: [] });

  const execute = useCallback((command: Command<T>) => {
    if (batchRef.current.depth > 0) {
      // Inside a batch: apply now, record later (endBatch makes the entry).
      batchRef.current.commands.push(command);
      setHistory((h) => ({ ...h, present: command.do(h.present) }));
      return;
    }
    setHistory((h) => {
      const present = command.do(h.present);
      const top = h.past[h.past.length - 1];
      const canMerge =
        command.mergeKey !== undefined && h.mergeOpen && top !== undefined && top.mergeKey === command.mergeKey;
      const entry: Entry<T> = { do: command.do, undo: command.undo, mergeKey: command.mergeKey };
      const past = canMerge
        ? [...h.past.slice(0, -1), compose(top, entry, command.mergeKey)]
        : trim([...h.past, entry], limitRef.current);
      return { present, past, future: [], mergeOpen: true }; // new command discards redo
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      const top = h.past[h.past.length - 1];
      if (!top) return h; // no-op keeps identity
      return { present: top.undo(h.present), past: h.past.slice(0, -1), future: [top, ...h.future], mergeOpen: false };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      const [next, ...rest] = h.future;
      if (!next) return h;
      return { present: next.do(h.present), past: [...h.past, next], future: rest, mergeOpen: false };
    });
  }, []);

  const beginBatch = useCallback(() => {
    batchRef.current.depth += 1;
  }, []);

  const endBatch = useCallback(() => {
    const batch = batchRef.current;
    if (batch.depth === 0) return; // unbalanced endBatch: ignored
    batch.depth -= 1;
    if (batch.depth > 0) return; // nested: wait for the outermost
    const commands = batch.commands;
    batch.commands = [];
    if (commands.length === 0) return; // empty batch adds nothing
    // One entry for the whole batch; no mergeKey so it never merges with neighbours.
    const entry = commands
      .map<Entry<T>>((c) => ({ do: c.do, undo: c.undo }))
      .reduce((acc, e) => compose(acc, e));
    setHistory((h) => ({ ...h, past: trim([...h.past, entry], limitRef.current), future: [], mergeOpen: false }));
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

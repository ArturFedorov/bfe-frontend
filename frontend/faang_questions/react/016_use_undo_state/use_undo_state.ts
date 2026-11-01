import { useCallback, useState } from 'react';

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
  const [history, setHistory] = useState<UndoHistory<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback<UndoSet<T>>((value) => {
    setHistory(({ past, present }) => {
      const next =
        typeof value === 'function'
          ? (value as (prev: T) => T)(present)
          : value;

      return { past: [...past, present], present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const [next, ...rest] = h.future;

      return { past: [...h.past, h.present], present: next, future: rest };
    });
  }, []);

  return {
    state: history.present,
    set,
    redo,
    undo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

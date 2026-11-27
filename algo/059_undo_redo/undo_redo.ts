/**
 * Two-stack undo/redo state manager.
 *
 * - `do(nextState)` records a new state and clears the redo stack.
 * - `undo()` / `redo()` move through history and return the new current state;
 *   they throw an Error when there is nothing to undo/redo.
 * - Every operation is O(1).
 */
export class UndoRedoManager<T> {
  constructor(initialState: T) {
    // TODO: implement
    throw new Error('Not implemented');
  }

  getState(): T {
    // TODO: implement
    throw new Error('Not implemented');
  }

  do(nextState: T): void {
    // TODO: implement
    throw new Error('Not implemented');
  }

  undo(): T {
    // TODO: implement
    throw new Error('Not implemented');
  }

  redo(): T {
    // TODO: implement
    throw new Error('Not implemented');
  }

  canUndo(): boolean {
    // TODO: implement
    throw new Error('Not implemented');
  }

  canRedo(): boolean {
    // TODO: implement
    throw new Error('Not implemented');
  }
}

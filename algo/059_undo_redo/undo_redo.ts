/**
 * Two-stack undo/redo state manager.
 *
 * - `do(nextState)` records a new state and clears the redo stack.
 * - `undo()` / `redo()` move through history and return the new current state;
 *   they throw an Error when there is nothing to undo/redo.
 * - Every operation is O(1).
 */
export class UndoRedoManager<T> {
  private current: T;
  private readonly undoStack: T[] = [];
  private redoStack: T[] = [];

  constructor(initialState: T) {
    this.current = initialState;
  }

  getState(): T {
    return this.current;
  }

  do(nextState: T): void {
    this.undoStack.push(this.current);
    this.current = nextState;
    this.redoStack = [];
  }

  undo(): T {
    if (this.undoStack.length === 0) {
      throw new Error('Nothing to undo');
    }
    this.redoStack.push(this.current);
    this.current = this.undoStack.pop() as T;
    return this.current;
  }

  redo(): T {
    if (this.redoStack.length === 0) {
      throw new Error('Nothing to redo');
    }
    this.undoStack.push(this.current);
    this.current = this.redoStack.pop() as T;
    return this.current;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

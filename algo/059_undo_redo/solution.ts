/**
 * 059. Undo / Redo State Manager — reference solution
 *
 * Two stacks plus a `current` slot. `do` pushes current onto the undo stack and
 * clears redo; `undo`/`redo` shuttle `current` between the two stacks.
 *
 * Time: O(1) per operation. Space: O(n) for n recorded actions.
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

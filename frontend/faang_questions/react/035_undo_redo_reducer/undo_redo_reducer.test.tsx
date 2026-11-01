import {
  HistoryAction,
  HistoryState,
  canRedo,
  canUndo,
  createHistoryState,
  withUndoRedo,
} from './undo_redo_reducer';

// Base reducer #1: a counter.
type CounterAction = { type: 'inc' } | { type: 'add'; amount: number } | { type: 'noop' };
function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case 'inc':
      return state + 1;
    case 'add':
      return state + action.amount;
    case 'noop':
      return state;
  }
}

// Base reducer #2: a tag list, a completely different state shape.
type TagsAction = { type: 'addTag'; tag: string } | { type: 'removeTag'; tag: string };
function tagsReducer(state: string[], action: TagsAction): string[] {
  switch (action.type) {
    case 'addTag':
      return [...state, action.tag];
    case 'removeTag':
      return state.filter((tag) => tag !== action.tag);
  }
}

describe('withUndoRedo', () => {
  describe('wrapping the counter reducer', () => {
    // Built lazily per call so an unimplemented withUndoRedo fails tests, not collection.
    const reducer = (
      state: HistoryState<number>,
      action: HistoryAction<CounterAction>,
    ): HistoryState<number> => withUndoRedo(counterReducer)(state, action);

    it('createHistoryState starts with empty stacks', () => {
      const state = createHistoryState(0);
      expect(state).toEqual({ past: [], present: 0, future: [] });
      expect(canUndo(state)).toBe(false);
      expect(canRedo(state)).toBe(false);
    });

    it('forwards base actions and records history', () => {
      let state = createHistoryState(0);
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'add', amount: 10 });
      expect(state.present).toBe(11);
      expect(state.past).toEqual([0, 1]);
      expect(canUndo(state)).toBe(true);
    });

    it('undo restores the previous present and fills future', () => {
      let state = createHistoryState(0);
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'undo' });
      expect(state.present).toBe(1);
      expect(state.past).toEqual([0]);
      expect(state.future).toEqual([2]);
      expect(canRedo(state)).toBe(true);
    });

    it('redo replays the undone state', () => {
      let state = createHistoryState(0);
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'undo' });
      state = reducer(state, { type: 'redo' });
      expect(state.present).toBe(1);
      expect(state.past).toEqual([0]);
      expect(state.future).toEqual([]);
    });

    it('a new action after undo clears the future', () => {
      let state = createHistoryState(0);
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'undo' });
      state = reducer(state, { type: 'add', amount: 5 });
      expect(state.present).toBe(6);
      expect(state.future).toEqual([]);
      expect(canRedo(state)).toBe(false);
    });

    it('undo with empty past and redo with empty future are same-reference no-ops', () => {
      const state = createHistoryState(0);
      expect(reducer(state, { type: 'undo' })).toBe(state);
      expect(reducer(state, { type: 'redo' })).toBe(state);
    });

    it('a base-level no-op does not create a history entry', () => {
      const state = createHistoryState(7);
      expect(reducer(state, { type: 'noop' })).toBe(state);
    });

    it('checkpoint commits present and empties both stacks', () => {
      let state = createHistoryState(0);
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'inc' });
      state = reducer(state, { type: 'undo' });
      state = reducer(state, { type: 'checkpoint' });
      expect(state).toEqual({ past: [], present: 1, future: [] });
      expect(reducer(state, { type: 'undo' })).toBe(state);
    });

    it('does not mutate previous history states', () => {
      const initial = createHistoryState(0);
      const after = reducer(initial, { type: 'inc' });
      expect(initial.past).toEqual([]);
      expect(initial.present).toBe(0);
      expect(after).not.toBe(initial);
    });
  });

  describe('wrapping the tags reducer (a different base reducer)', () => {
    const reducer = (
      state: HistoryState<string[]>,
      action: HistoryAction<TagsAction>,
    ): HistoryState<string[]> => withUndoRedo(tagsReducer)(state, action);

    it('records, undoes, and redoes list states', () => {
      let state: HistoryState<string[]> = createHistoryState<string[]>([]);
      state = reducer(state, { type: 'addTag', tag: 'live' });
      state = reducer(state, { type: 'addTag', tag: '4k' });
      expect(state.present).toEqual(['live', '4k']);

      state = reducer(state, { type: 'undo' });
      expect(state.present).toEqual(['live']);

      state = reducer(state, { type: 'redo' });
      expect(state.present).toEqual(['live', '4k']);
    });

    it('branching after undo discards the old future', () => {
      let state: HistoryState<string[]> = createHistoryState<string[]>([]);
      state = reducer(state, { type: 'addTag', tag: 'live' });
      state = reducer(state, { type: 'addTag', tag: '4k' });
      state = reducer(state, { type: 'undo' });
      state = reducer(state, { type: 'addTag', tag: 'hdr' });
      expect(state.present).toEqual(['live', 'hdr']);
      expect(state.future).toEqual([]);
    });
  });
});

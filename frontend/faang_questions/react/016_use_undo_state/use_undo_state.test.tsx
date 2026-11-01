/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useUndoState } from './use_undo_state';

describe('useUndoState', () => {
  it('starts at the initial value with nothing to undo or redo', () => {
    const { result } = renderHook(() => useUndoState('rule-v1'));

    expect(result.current.state).toBe('rule-v1');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('set updates the present and enables undo', () => {
    const { result } = renderHook(() => useUndoState('a'));

    act(() => result.current.set('b'));

    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useUndoState(10));

    act(() => result.current.set((prev) => prev + 5));

    expect(result.current.state).toBe(15);
    act(() => result.current.undo());
    expect(result.current.state).toBe(10);
  });

  it('undo walks back and redo walks forward through the full history', () => {
    const { result } = renderHook(() => useUndoState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.set('c'));

    act(() => result.current.undo());
    expect(result.current.state).toBe('b');
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.redo());
    expect(result.current.state).toBe('b');

    act(() => result.current.redo());
    expect(result.current.state).toBe('c');
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });

  it('undo with no past is a silent no-op', () => {
    const { result } = renderHook(() => useUndoState('a'));

    act(() => result.current.undo());

    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);
  });

  it('redo with no future is a silent no-op', () => {
    const { result } = renderHook(() => useUndoState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.redo());

    expect(result.current.state).toBe('b');
  });

  it('a new set after undo clears the future branch', () => {
    const { result } = renderHook(() => useUndoState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.undo());
    expect(result.current.state).toBe('b');
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.set('x'));

    expect(result.current.state).toBe('x');
    expect(result.current.canRedo).toBe(false);

    // redo must not resurrect the discarded 'c'
    act(() => result.current.redo());
    expect(result.current.state).toBe('x');

    // history below the branch point is intact
    act(() => result.current.undo());
    expect(result.current.state).toBe('b');
    act(() => result.current.undo());
    expect(result.current.state).toBe('a');
  });

  it('works with non-primitive states', () => {
    const v1 = { rules: ['r1'] };
    const v2 = { rules: ['r1', 'r2'] };
    const { result } = renderHook(() => useUndoState(v1));

    act(() => result.current.set(v2));
    act(() => result.current.undo());

    expect(result.current.state).toBe(v1);
    act(() => result.current.redo());
    expect(result.current.state).toBe(v2);
  });

  it('keeps stable identities for set, undo, and redo across updates', () => {
    const { result, rerender } = renderHook(() => useUndoState('a'));
    const { set, undo, redo } = result.current;

    rerender();
    act(() => result.current.set('b'));
    act(() => result.current.undo());

    expect(result.current.set).toBe(set);
    expect(result.current.undo).toBe(undo);
    expect(result.current.redo).toBe(redo);
  });
});

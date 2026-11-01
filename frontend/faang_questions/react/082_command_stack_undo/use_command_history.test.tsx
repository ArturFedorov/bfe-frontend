/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { Command, useCommandHistory } from './use_command_history';

// --- A tiny labeler-like model the commands operate on ------------------------

interface Span {
  id: string;
  start: number;
  end: number;
  label: string;
}

interface LabelerState {
  spans: Span[];
}

const addSpan = (span: Span): Command<LabelerState> => ({
  label: `Add ${span.label}`,
  do: (s) => ({ spans: [...s.spans, span] }),
  undo: (s) => ({ spans: s.spans.filter((x) => x.id !== span.id) }),
});

const removeSpan = (span: Span): Command<LabelerState> => ({
  label: `Remove ${span.label}`,
  do: (s) => ({ spans: s.spans.filter((x) => x.id !== span.id) }),
  undo: (s) => ({ spans: [...s.spans, span] }),
});

const relabel = (id: string, from: string, to: string): Command<LabelerState> => ({
  label: `Relabel ${from} → ${to}`,
  do: (s) => ({ spans: s.spans.map((x) => (x.id === id ? { ...x, label: to } : x)) }),
  undo: (s) => ({ spans: s.spans.map((x) => (x.id === id ? { ...x, label: from } : x)) }),
});

/** Drag simulation: moving the end of a span is coalesced per span id. */
const moveEnd = (id: string, from: number, to: number): Command<LabelerState> => ({
  label: 'Move end',
  mergeKey: `drag:${id}`,
  do: (s) => ({ spans: s.spans.map((x) => (x.id === id ? { ...x, end: to } : x)) }),
  undo: (s) => ({ spans: s.spans.map((x) => (x.id === id ? { ...x, end: from } : x)) }),
});

const A: Span = { id: 'a', start: 0, end: 3, label: 'PERSON' };
const B: Span = { id: 'b', start: 4, end: 8, label: 'ORG' };
const C: Span = { id: 'c', start: 9, end: 13, label: 'DATE' };

// --- A typing model -------------------------------------------------------------

interface TextState {
  text: string;
}

const type = (chars: string, mergeKey: string | null = 'typing'): Command<TextState> => ({
  label: 'Type',
  mergeKey: mergeKey ?? undefined, // null → no mergeKey (an explicit undefined would hit the default)
  do: (s) => ({ text: s.text + chars }),
  undo: (s) => ({ text: s.text.slice(0, s.text.length - chars.length) }),
});

function labeler(options?: { limit?: number }) {
  return renderHook(() => useCommandHistory<LabelerState>({ spans: [] }, options));
}

function typing(options?: { limit?: number }) {
  return renderHook(() => useCommandHistory<TextState>({ text: '' }, options));
}

describe('useCommandHistory', () => {
  describe('execute / undo / redo', () => {
    it('execute applies do; undo reverts; redo re-applies; canUndo/canRedo follow the stacks', () => {
      const { result } = labeler();
      expect(result.current.state).toEqual({ spans: [] });
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      act(() => result.current.execute(addSpan(A)));
      act(() => result.current.execute(addSpan(B)));
      expect(result.current.state).toEqual({ spans: [A, B] });
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [A] });
      expect(result.current.canRedo).toBe(true);

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [] });
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.redo());
      act(() => result.current.redo());
      expect(result.current.state).toEqual({ spans: [A, B] });
      expect(result.current.canRedo).toBe(false);
    });

    it('undo with no past and redo with no future are no-ops', () => {
      const { result } = labeler();
      const before = result.current.state;
      act(() => result.current.undo());
      act(() => result.current.redo());
      expect(result.current.state).toBe(before);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('a new command after undo discards the redo stack', () => {
      const { result } = labeler();
      act(() => result.current.execute(addSpan(A)));
      act(() => result.current.execute(addSpan(B)));
      act(() => result.current.undo());
      expect(result.current.canRedo).toBe(true);

      act(() => result.current.execute(addSpan(C)));
      expect(result.current.state).toEqual({ spans: [A, C] });
      expect(result.current.canRedo).toBe(false);

      act(() => result.current.redo());
      expect(result.current.state).toEqual({ spans: [A, C] });
    });

    it('commands compose: remove then relabel undo in reverse order', () => {
      const { result } = labeler();
      act(() => result.current.execute(addSpan(A)));
      act(() => result.current.execute(addSpan(B)));
      act(() => result.current.execute(removeSpan(A)));
      act(() => result.current.execute(relabel('b', 'ORG', 'EVENT')));
      expect(result.current.state).toEqual({ spans: [{ ...B, label: 'EVENT' }] });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [B] });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [B, A] });
    });
  });

  describe('merging consecutive commands', () => {
    it('five typed characters with the same mergeKey undo in a single step and redo in a single step', () => {
      const { result } = typing();
      for (const ch of 'hello') act(() => result.current.execute(type(ch)));
      expect(result.current.state).toEqual({ text: 'hello' });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: '' });
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.redo());
      expect(result.current.state).toEqual({ text: 'hello' });
      expect(result.current.canRedo).toBe(false);
    });

    it('a command with a different mergeKey (or none) breaks the merge', () => {
      const { result } = typing();
      act(() => result.current.execute(type('ab')));
      act(() => result.current.execute(type('c')));
      act(() => result.current.execute(type(' ', null))); // no mergeKey → own entry
      act(() => result.current.execute(type('d', 'typing-2')));
      act(() => result.current.execute(type('e', 'typing-2')));
      expect(result.current.state).toEqual({ text: 'abc de' });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'abc ' });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'abc' });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: '' });
      expect(result.current.canUndo).toBe(false);
    });

    it('drag coalescing: many moveEnd commands for one span undo to the original end in one step', () => {
      const { result } = labeler();
      act(() => result.current.execute(addSpan(A)));
      let end = A.end;
      for (const next of [4, 5, 6, 7]) {
        const from = end;
        act(() => result.current.execute(moveEnd('a', from, next)));
        end = next;
      }
      expect(result.current.state.spans[0].end).toBe(7);

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [A] });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [] });
    });

    it('undo or redo closes the merge window: the next same-key command starts a new entry', () => {
      const { result } = typing();
      act(() => result.current.execute(type('a')));
      act(() => result.current.execute(type('b')));
      act(() => result.current.undo());
      act(() => result.current.redo());
      expect(result.current.state).toEqual({ text: 'ab' });

      act(() => result.current.execute(type('c')));
      expect(result.current.state).toEqual({ text: 'abc' });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'ab' });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: '' });
    });
  });

  describe('history limit', () => {
    it('limit=3 after five distinct commands allows exactly three undos', () => {
      const { result } = labeler({ limit: 3 });
      const spans = ['1', '2', '3', '4', '5'].map((id) => ({ ...A, id, label: `L${id}` }));
      for (const s of spans) act(() => result.current.execute(addSpan(s)));
      expect(result.current.state.spans).toHaveLength(5);

      act(() => result.current.undo());
      act(() => result.current.undo());
      act(() => result.current.undo());
      expect(result.current.state.spans.map((s) => s.id)).toEqual(['1', '2']);
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.undo());
      expect(result.current.state.spans.map((s) => s.id)).toEqual(['1', '2']);
      expect(result.current.canRedo).toBe(true);
    });

    it('a merged run counts as one entry toward the limit', () => {
      const { result } = typing({ limit: 2 });
      act(() => result.current.execute(type('x', null)));
      for (const ch of 'hello') act(() => result.current.execute(type(ch)));
      act(() => result.current.execute(type('!', null)));
      expect(result.current.state).toEqual({ text: 'xhello!' });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'xhello' });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'x' });
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('batch transactions', () => {
    it('beginBatch/endBatch groups several commands into one undo/redo step', () => {
      const { result } = labeler();
      act(() => result.current.execute(addSpan(A)));
      act(() => {
        result.current.beginBatch();
        result.current.execute(addSpan(B));
        result.current.execute(addSpan(C));
        result.current.execute(relabel('a', 'PERSON', 'EVENT'));
        result.current.endBatch();
      });
      expect(result.current.state).toEqual({ spans: [{ ...A, label: 'EVENT' }, B, C] });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [A] });
      expect(result.current.canUndo).toBe(true);

      act(() => result.current.redo());
      expect(result.current.state).toEqual({ spans: [{ ...A, label: 'EVENT' }, B, C] });
    });

    it('state updates are visible while the batch is still open', () => {
      const { result } = labeler();
      act(() => result.current.beginBatch());
      act(() => result.current.execute(addSpan(A)));
      expect(result.current.state).toEqual({ spans: [A] });
      act(() => result.current.endBatch());
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [] });
    });

    it('nested batches flatten into a single entry', () => {
      const { result } = labeler();
      act(() => {
        result.current.beginBatch();
        result.current.execute(addSpan(A));
        result.current.beginBatch();
        result.current.execute(addSpan(B));
        result.current.endBatch();
        result.current.execute(addSpan(C));
        result.current.endBatch();
      });
      expect(result.current.state).toEqual({ spans: [A, B, C] });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [] });
      expect(result.current.canUndo).toBe(false);
    });

    it('a batch of mergeable commands is still exactly one entry and does not merge with typing around it', () => {
      const { result } = typing();
      act(() => result.current.execute(type('a')));
      act(() => {
        result.current.beginBatch();
        for (const ch of 'xyz') result.current.execute(type(ch));
        result.current.endBatch();
      });
      act(() => result.current.execute(type('b')));
      expect(result.current.state).toEqual({ text: 'axyzb' });

      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'axyz' });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: 'a' });
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ text: '' });
      expect(result.current.canUndo).toBe(false);
    });

    it('an empty batch adds no entry; an unbalanced endBatch is ignored', () => {
      const { result } = labeler();
      act(() => {
        result.current.beginBatch();
        result.current.endBatch();
        result.current.endBatch();
      });
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.execute(addSpan(A)));
      act(() => result.current.undo());
      expect(result.current.state).toEqual({ spans: [] });
    });
  });

  describe('identity', () => {
    it('execute, undo, redo, beginBatch and endBatch keep the same identity across renders', () => {
      const { result, rerender } = labeler();
      const first = result.current;
      act(() => result.current.execute(addSpan(A)));
      rerender();
      const second = result.current;
      expect(second.state).not.toBe(first.state);
      expect(second.execute).toBe(first.execute);
      expect(second.undo).toBe(first.undo);
      expect(second.redo).toBe(first.redo);
      expect(second.beginBatch).toBe(first.beginBatch);
      expect(second.endBatch).toBe(first.endBatch);
    });
  });
});

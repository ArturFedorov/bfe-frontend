import { UndoRedoManager } from './undo_redo';

describe('UndoRedoManager', () => {
  describe('basic do / undo / redo', () => {
    it('returns the initial state before any action', () => {
      const mgr = new UndoRedoManager('v1');
      expect(mgr.getState()).toBe('v1');
    });

    it('updates the current state on do', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      expect(mgr.getState()).toBe('v2');
    });

    it('undo steps back and returns the new current state', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      mgr.do('v3');
      expect(mgr.undo()).toBe('v2');
      expect(mgr.getState()).toBe('v2');
      expect(mgr.undo()).toBe('v1');
      expect(mgr.getState()).toBe('v1');
    });

    it('redo steps forward after an undo', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      mgr.undo();
      expect(mgr.redo()).toBe('v2');
      expect(mgr.getState()).toBe('v2');
    });

    it('supports interleaved undo and redo across several states', () => {
      const mgr = new UndoRedoManager(1);
      mgr.do(2);
      mgr.do(3);
      mgr.do(4);
      expect(mgr.undo()).toBe(3);
      expect(mgr.undo()).toBe(2);
      expect(mgr.redo()).toBe(3);
      expect(mgr.redo()).toBe(4);
      expect(mgr.getState()).toBe(4);
    });
  });

  describe('canUndo / canRedo', () => {
    it('reports no undo or redo on a fresh manager', () => {
      const mgr = new UndoRedoManager('v1');
      expect(mgr.canUndo()).toBe(false);
      expect(mgr.canRedo()).toBe(false);
    });

    it('reports undo available after an action, redo after an undo', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      expect(mgr.canUndo()).toBe(true);
      expect(mgr.canRedo()).toBe(false);
      mgr.undo();
      expect(mgr.canUndo()).toBe(false);
      expect(mgr.canRedo()).toBe(true);
    });
  });

  describe('a new action clears the redo stack', () => {
    it('cannot redo after doing a new action mid-history', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      mgr.do('v3');
      mgr.undo();
      mgr.do('v2b');
      expect(mgr.canRedo()).toBe(false);
      expect(mgr.getState()).toBe('v2b');
      expect(mgr.undo()).toBe('v2');
      expect(mgr.redo()).toBe('v2b');
    });
  });

  describe('error behavior', () => {
    it('throws when undoing with no history', () => {
      const mgr = new UndoRedoManager('v1');
      expect(() => mgr.undo()).toThrow();
    });

    it('throws when redoing with nothing undone', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      expect(() => mgr.redo()).toThrow();
    });

    it('throws when undoing past the initial state', () => {
      const mgr = new UndoRedoManager('v1');
      mgr.do('v2');
      mgr.undo();
      expect(() => mgr.undo()).toThrow();
    });
  });

  describe('generic state types', () => {
    it('works with object snapshots', () => {
      const a = { text: 'a' };
      const b = { text: 'b' };
      const mgr = new UndoRedoManager(a);
      mgr.do(b);
      expect(mgr.undo()).toBe(a);
      expect(mgr.redo()).toBe(b);
    });
  });

  describe('large input', () => {
    it('handles 100_000 actions, full undo, and full redo in O(1) each', () => {
      const n = 100_000;
      const mgr = new UndoRedoManager(0);
      for (let i = 1; i <= n; i++) {
        mgr.do(i);
      }
      expect(mgr.getState()).toBe(n);
      for (let i = n - 1; i >= 0; i--) {
        expect(mgr.undo()).toBe(i);
      }
      expect(mgr.canUndo()).toBe(false);
      for (let i = 1; i <= n; i++) {
        expect(mgr.redo()).toBe(i);
      }
      expect(mgr.canRedo()).toBe(false);
    });
  });
});

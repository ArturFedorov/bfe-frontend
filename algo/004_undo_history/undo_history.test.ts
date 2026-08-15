import { UndoHistory } from './undo_history';

describe('UndoHistory', () => {
  it('starts empty', () => {
    const h = new UndoHistory<string>(3);
    expect(h.size()).toBe(0);
  });

  it('pushes snapshots and reports the current one', () => {
    const h = new UndoHistory<string>(3);
    h.push('a');
    h.push('b');
    expect(h.size()).toBe(2);
    expect(h.current()).toBe('b');
  });

  it('drops the oldest snapshot when max depth is exceeded', () => {
    const h = new UndoHistory<string>(3);
    h.push('a');
    h.push('b');
    h.push('c');
    h.push('d'); // 'a' dropped
    expect(h.size()).toBe(3);
    expect(h.current()).toBe('d');
    expect(h.jumpTo(0)).toBe('b');
  });

  it('keeps working after many overflows', () => {
    const h = new UndoHistory<number>(2);
    for (let i = 1; i <= 10; i++) {
      h.push(i);
    }
    expect(h.size()).toBe(2);
    expect(h.current()).toBe(10);
    expect(h.jumpTo(0)).toBe(9);
  });

  describe('jumpTo', () => {
    it('returns the snapshot and discards everything newer', () => {
      const h = new UndoHistory<string>(5);
      h.push('a');
      h.push('b');
      h.push('c');
      expect(h.jumpTo(0)).toBe('a');
      expect(h.size()).toBe(1);
      expect(h.current()).toBe('a');
    });

    it('jumping to the newest snapshot is a no-op', () => {
      const h = new UndoHistory<string>(5);
      h.push('a');
      h.push('b');
      expect(h.jumpTo(1)).toBe('b');
      expect(h.size()).toBe(2);
      expect(h.current()).toBe('b');
    });

    it('pushing after a jump starts a fresh branch', () => {
      const h = new UndoHistory<string>(5);
      h.push('a');
      h.push('b');
      h.push('c');
      h.jumpTo(0); // back to 'a'
      h.push('x');
      expect(h.size()).toBe(2);
      expect(h.current()).toBe('x');
      expect(h.jumpTo(0)).toBe('a');
    });

    it('respects max depth for pushes after a jump', () => {
      const h = new UndoHistory<string>(2);
      h.push('a');
      h.push('b');
      h.jumpTo(0); // ['a']
      h.push('x'); // ['a', 'x']
      h.push('y'); // ['x', 'y'] — 'a' dropped
      expect(h.size()).toBe(2);
      expect(h.jumpTo(0)).toBe('x');
    });
  });

  it('supports max depth of 1', () => {
    const h = new UndoHistory<string>(1);
    h.push('a');
    h.push('b');
    expect(h.size()).toBe(1);
    expect(h.current()).toBe('b');
    expect(h.jumpTo(0)).toBe('b');
  });

  it('stores identical snapshots as separate entries', () => {
    const h = new UndoHistory<string>(3);
    h.push('same');
    h.push('same');
    expect(h.size()).toBe(2);
    expect(h.jumpTo(0)).toBe('same');
    expect(h.size()).toBe(1);
  });

  describe('errors', () => {
    it.each([
      ['zero', 0],
      ['negative', -2],
      ['non-integer', 1.5],
      ['NaN', NaN],
    ])('constructor throws RangeError on %s maxDepth', (_label, maxDepth) => {
      expect(() => new UndoHistory<string>(maxDepth)).toThrow(RangeError);
    });

    it('current() throws Error when empty', () => {
      const h = new UndoHistory<string>(3);
      expect(() => h.current()).toThrow(Error);
    });

    it.each([
      ['negative index', -1],
      ['index equal to size', 2],
      ['index beyond size', 10],
    ])('jumpTo throws RangeError on %s', (_label, index) => {
      const h = new UndoHistory<string>(5);
      h.push('a');
      h.push('b');
      expect(() => h.jumpTo(index)).toThrow(RangeError);
    });

    it('jumpTo throws RangeError on an empty history', () => {
      const h = new UndoHistory<string>(5);
      expect(() => h.jumpTo(0)).toThrow(RangeError);
    });
  });

  it('handles 100k pushes with a 50k depth without O(n) shifting', () => {
    const maxDepth = 50_000;
    const n = 100_000;
    const h = new UndoHistory<number>(maxDepth);
    for (let i = 0; i < n; i++) {
      h.push(i);
    }
    expect(h.size()).toBe(maxDepth);
    expect(h.current()).toBe(n - 1);
    // Oldest retained snapshot is push #50_000.
    expect(h.jumpTo(0)).toBe(n - maxDepth);
    expect(h.size()).toBe(1);
  });
});

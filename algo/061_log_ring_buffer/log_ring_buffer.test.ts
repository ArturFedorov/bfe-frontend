import { LogRingBuffer } from './log_ring_buffer';

describe('LogRingBuffer', () => {
  describe('before reaching capacity', () => {
    it('starts empty', () => {
      const buf = new LogRingBuffer(3);
      expect(buf.getAll()).toEqual([]);
      expect(buf.size()).toBe(0);
    });

    it('returns lines oldest to newest while filling', () => {
      const buf = new LogRingBuffer(3);
      buf.append('a');
      buf.append('b');
      expect(buf.getAll()).toEqual(['a', 'b']);
      expect(buf.size()).toBe(2);
    });

    it('holds exactly capacity lines when just full', () => {
      const buf = new LogRingBuffer(3);
      buf.append('a');
      buf.append('b');
      buf.append('c');
      expect(buf.getAll()).toEqual(['a', 'b', 'c']);
      expect(buf.size()).toBe(3);
    });
  });

  describe('overwriting when full', () => {
    it('drops the oldest line on overflow', () => {
      const buf = new LogRingBuffer(3);
      buf.append('a');
      buf.append('b');
      buf.append('c');
      buf.append('d');
      expect(buf.getAll()).toEqual(['b', 'c', 'd']);
      expect(buf.size()).toBe(3);
    });

    it('stays correct across multiple full wrap-arounds', () => {
      const buf = new LogRingBuffer(3);
      for (let i = 1; i <= 10; i++) {
        buf.append(`line-${i}`);
      }
      expect(buf.getAll()).toEqual(['line-8', 'line-9', 'line-10']);
      expect(buf.size()).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('works with capacity 1', () => {
      const buf = new LogRingBuffer(1);
      buf.append('a');
      expect(buf.getAll()).toEqual(['a']);
      buf.append('b');
      expect(buf.getAll()).toEqual(['b']);
      expect(buf.size()).toBe(1);
    });

    it('returns a fresh array from getAll', () => {
      const buf = new LogRingBuffer(2);
      buf.append('a');
      const snapshot = buf.getAll();
      snapshot.push('tampered');
      expect(buf.getAll()).toEqual(['a']);
    });

    it('stores duplicate and empty-string lines faithfully', () => {
      const buf = new LogRingBuffer(3);
      buf.append('x');
      buf.append('');
      buf.append('x');
      expect(buf.getAll()).toEqual(['x', '', 'x']);
    });
  });

  describe('constructor validation', () => {
    it.each([
      ['zero', 0],
      ['negative', -3],
      ['non-integer', 2.5],
      ['NaN', NaN],
    ])('throws on %s capacity', (_label, capacity) => {
      expect(() => new LogRingBuffer(capacity)).toThrow();
    });
  });

  describe('large input', () => {
    it('absorbs 100_000 appends into a capacity-1000 buffer in O(1) each', () => {
      const capacity = 1_000;
      const total = 100_000;
      const buf = new LogRingBuffer(capacity);
      for (let i = 1; i <= total; i++) {
        buf.append(`line-${i}`);
      }
      expect(buf.size()).toBe(capacity);
      const all = buf.getAll();
      expect(all).toHaveLength(capacity);
      expect(all[0]).toBe(`line-${total - capacity + 1}`);
      expect(all[capacity - 1]).toBe(`line-${total}`);
      // spot-check the middle to confirm ordering, not just the ends
      expect(all[500]).toBe(`line-${total - capacity + 1 + 500}`);
    });
  });
});

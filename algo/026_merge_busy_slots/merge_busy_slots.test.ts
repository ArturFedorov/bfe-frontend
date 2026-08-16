import { mergeBusySlots, Interval } from './merge_busy_slots';

describe('mergeBusySlots', () => {
  it('returns an empty array for no slots', () => {
    expect(mergeBusySlots([])).toEqual([]);
  });

  it('returns a single slot as-is', () => {
    expect(mergeBusySlots([{ start: 10, end: 20 }])).toEqual([
      { start: 10, end: 20 },
    ]);
  });

  it('keeps disjoint slots separate and sorted', () => {
    expect(
      mergeBusySlots([
        { start: 50, end: 60 },
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ]),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
      { start: 50, end: 60 },
    ]);
  });

  it('merges two overlapping slots', () => {
    expect(
      mergeBusySlots([
        { start: 10, end: 30 },
        { start: 20, end: 40 },
      ]),
    ).toEqual([{ start: 10, end: 40 }]);
  });

  describe('touching boundaries', () => {
    it('merges touching intervals into one block', () => {
      expect(
        mergeBusySlots([
          { start: 1, end: 3 },
          { start: 3, end: 5 },
        ]),
      ).toEqual([{ start: 1, end: 5 }]);
    });

    it('merges a long back-to-back chain into a single block', () => {
      expect(
        mergeBusySlots([
          { start: 30, end: 40 },
          { start: 0, end: 10 },
          { start: 10, end: 20 },
          { start: 20, end: 30 },
        ]),
      ).toEqual([{ start: 0, end: 40 }]);
    });

    it('does not merge slots separated by a one-minute gap', () => {
      expect(
        mergeBusySlots([
          { start: 0, end: 10 },
          { start: 11, end: 20 },
        ]),
      ).toEqual([
        { start: 0, end: 10 },
        { start: 11, end: 20 },
      ]);
    });
  });

  describe('nesting and duplicates', () => {
    it('absorbs a fully nested slot', () => {
      expect(
        mergeBusySlots([
          { start: 0, end: 100 },
          { start: 40, end: 50 },
        ]),
      ).toEqual([{ start: 0, end: 100 }]);
    });

    it('absorbs multiple nested slots', () => {
      expect(
        mergeBusySlots([
          { start: 10, end: 20 },
          { start: 0, end: 100 },
          { start: 90, end: 95 },
          { start: 50, end: 60 },
        ]),
      ).toEqual([{ start: 0, end: 100 }]);
    });

    it('collapses identical slots', () => {
      expect(
        mergeBusySlots([
          { start: 5, end: 15 },
          { start: 5, end: 15 },
          { start: 5, end: 15 },
        ]),
      ).toEqual([{ start: 5, end: 15 }]);
    });

    it('handles slots sharing a start with different ends', () => {
      expect(
        mergeBusySlots([
          { start: 10, end: 20 },
          { start: 10, end: 50 },
        ]),
      ).toEqual([{ start: 10, end: 50 }]);
    });
  });

  describe('unsorted input and purity', () => {
    it('merges a shuffled mix of overlapping, touching, and disjoint slots', () => {
      expect(
        mergeBusySlots([
          { start: 70, end: 80 },
          { start: 5, end: 12 },
          { start: 0, end: 10 },
          { start: 12, end: 20 },
          { start: 40, end: 55 },
          { start: 50, end: 60 },
        ]),
      ).toEqual([
        { start: 0, end: 20 },
        { start: 40, end: 60 },
        { start: 70, end: 80 },
      ]);
    });

    it('does not mutate the input array or its objects', () => {
      const input: Interval[] = [
        { start: 20, end: 40 },
        { start: 10, end: 30 },
      ];
      const snapshot = input.map((s) => ({ ...s }));
      mergeBusySlots(input);
      expect(input).toEqual(snapshot);
    });
  });

  describe('large input', () => {
    it('merges 100k slots into the expected blocks', () => {
      const n = 100_000;
      const slots: Interval[] = [];
      // Pairs (2k, 2k+1) overlap each other; consecutive pairs leave a gap of 5.
      // Block k covers [k*20, k*20 + 15).
      for (let k = 0; k < n / 2; k++) {
        const base = k * 20;
        slots.push({ start: base + 5, end: base + 15 });
        slots.push({ start: base, end: base + 10 });
      }
      const result = mergeBusySlots(slots);
      expect(result).toHaveLength(n / 2);
      expect(result[0]).toEqual({ start: 0, end: 15 });
      expect(result[1]).toEqual({ start: 20, end: 35 });
      expect(result[result.length - 1]).toEqual({
        start: (n / 2 - 1) * 20,
        end: (n / 2 - 1) * 20 + 15,
      });
    });
  });
});

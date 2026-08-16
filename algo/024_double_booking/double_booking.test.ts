import { hasDoubleBooking, Interval } from './double_booking';

/** Deterministic LCG-based shuffle so large tests never flake. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed;
  const next = (): number => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

describe('hasDoubleBooking', () => {
  it('returns false for an empty calendar', () => {
    expect(hasDoubleBooking([])).toBe(false);
  });

  it('returns false for a single meeting', () => {
    expect(hasDoubleBooking([{ start: 10, end: 20 }])).toBe(false);
  });

  it('returns false for disjoint meetings', () => {
    expect(
      hasDoubleBooking([
        { start: 0, end: 30 },
        { start: 45, end: 60 },
        { start: 90, end: 120 },
      ]),
    ).toBe(false);
  });

  it('detects a simple overlap', () => {
    expect(
      hasDoubleBooking([
        { start: 0, end: 30 },
        { start: 15, end: 45 },
      ]),
    ).toBe(true);
  });

  describe('boundary semantics', () => {
    it('does not treat a shared boundary as a double-booking', () => {
      expect(
        hasDoubleBooking([
          { start: 0, end: 30 },
          { start: 30, end: 60 },
        ]),
      ).toBe(false);
    });

    it('does not treat a chain of back-to-back meetings as conflicts', () => {
      expect(
        hasDoubleBooking([
          { start: 0, end: 10 },
          { start: 10, end: 20 },
          { start: 20, end: 30 },
          { start: 30, end: 40 },
        ]),
      ).toBe(false);
    });

    it('detects an overlap of a single minute', () => {
      expect(
        hasDoubleBooking([
          { start: 0, end: 31 },
          { start: 30, end: 60 },
        ]),
      ).toBe(true);
    });
  });

  describe('edge shapes', () => {
    it('detects identical meetings', () => {
      expect(
        hasDoubleBooking([
          { start: 5, end: 15 },
          { start: 5, end: 15 },
        ]),
      ).toBe(true);
    });

    it('detects a fully nested meeting', () => {
      expect(
        hasDoubleBooking([
          { start: 0, end: 100 },
          { start: 40, end: 50 },
        ]),
      ).toBe(true);
    });

    it('detects meetings sharing the same start', () => {
      expect(
        hasDoubleBooking([
          { start: 10, end: 20 },
          { start: 10, end: 30 },
        ]),
      ).toBe(true);
    });
  });

  describe('unsorted input', () => {
    it('handles unsorted input without a conflict', () => {
      expect(
        hasDoubleBooking([
          { start: 90, end: 120 },
          { start: 0, end: 30 },
          { start: 45, end: 60 },
        ]),
      ).toBe(false);
    });

    it('handles unsorted input with a conflict', () => {
      expect(
        hasDoubleBooking([
          { start: 90, end: 120 },
          { start: 0, end: 50 },
          { start: 45, end: 60 },
        ]),
      ).toBe(true);
    });

    it('does not mutate the input array', () => {
      const input: Interval[] = [
        { start: 40, end: 50 },
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ];
      const snapshot = input.map((m) => ({ ...m }));
      hasDoubleBooking(input);
      expect(input).toEqual(snapshot);
    });
  });

  describe('large input', () => {
    const n = 100_000;

    it('handles 100k disjoint meetings', () => {
      const meetings: Interval[] = [];
      for (let i = 0; i < n; i++) {
        meetings.push({ start: i * 10, end: i * 10 + 5 });
      }
      expect(hasDoubleBooking(seededShuffle(meetings, 42))).toBe(false);
    });

    it('finds the single conflict among 100k meetings', () => {
      const meetings: Interval[] = [];
      for (let i = 0; i < n; i++) {
        meetings.push({ start: i * 10, end: i * 10 + 5 });
      }
      // One meeting overlapping meeting #77777 by a single minute.
      meetings.push({ start: 777_774, end: 777_776 });
      expect(hasDoubleBooking(seededShuffle(meetings, 7))).toBe(true);
    });
  });
});

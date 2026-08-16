import { daysUntilFasterBuild } from './build_speed_watch';

describe('daysUntilFasterBuild', () => {
  describe('happy path', () => {
    it('handles the mixed example', () => {
      expect(daysUntilFasterBuild([12, 15, 10, 10, 8])).toEqual([
        2, 1, 2, 1, 0,
      ]);
    });

    it('resolves each day immediately on a strictly decreasing series', () => {
      expect(daysUntilFasterBuild([9, 8, 7, 6])).toEqual([1, 1, 1, 0]);
    });

    it('never resolves on a strictly increasing series', () => {
      expect(daysUntilFasterBuild([5, 6, 7, 8])).toEqual([0, 0, 0, 0]);
    });

    it('handles a valley shape where early days wait for the drop', () => {
      expect(daysUntilFasterBuild([30, 40, 50, 10, 20])).toEqual([
        3, 2, 1, 0, 0,
      ]);
    });
  });

  describe('strictness with equal times', () => {
    it('does not treat an equal time as faster', () => {
      expect(daysUntilFasterBuild([10, 10, 10])).toEqual([0, 0, 0]);
    });

    it('skips over equal times to a genuinely faster day', () => {
      expect(daysUntilFasterBuild([10, 10, 9])).toEqual([2, 1, 0]);
    });
  });

  describe('edge cases', () => {
    it('returns [] for an empty series', () => {
      expect(daysUntilFasterBuild([])).toEqual([]);
    });

    it('returns [0] for a single day', () => {
      expect(daysUntilFasterBuild([9])).toEqual([0]);
    });

    it('handles two days both ways', () => {
      expect(daysUntilFasterBuild([9, 5])).toEqual([1, 0]);
      expect(daysUntilFasterBuild([5, 9])).toEqual([0, 0]);
    });

    it('handles fractional build times', () => {
      expect(daysUntilFasterBuild([2.5, 2.4, 2.45])).toEqual([1, 0, 0]);
    });

    it('does not mutate the input array', () => {
      const input = [12, 15, 10];
      daysUntilFasterBuild(input);
      expect(input).toEqual([12, 15, 10]);
    });
  });

  describe('large input', () => {
    it('handles 100_000 days in linear time', () => {
      const n = 100_000;

      // Strictly decreasing: every day resolves the next day.
      const decreasing = Array.from({ length: n }, (_, i) => n - i);
      const decExpected = Array.from({ length: n }, (_, i) =>
        i === n - 1 ? 0 : 1,
      );
      expect(daysUntilFasterBuild(decreasing)).toEqual(decExpected);

      // Strictly increasing: worst case for the stack — nothing ever resolves.
      const increasing = Array.from({ length: n }, (_, i) => i + 1);
      const incExpected = new Array<number>(n).fill(0);
      expect(daysUntilFasterBuild(increasing)).toEqual(incExpected);
    });
  });
});

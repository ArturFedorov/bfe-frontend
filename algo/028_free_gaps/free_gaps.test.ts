import { freeGaps, Interval } from './free_gaps';

describe('freeGaps', () => {
  const day: Interval = { start: 0, end: 480 };

  it('returns the whole day when there are no bookings', () => {
    expect(freeGaps([], { start: 540, end: 1020 }, 60)).toEqual([
      { start: 540, end: 1020 },
    ]);
  });

  it('returns nothing when the day itself is shorter than the minimum', () => {
    expect(freeGaps([], { start: 0, end: 29 }, 30)).toEqual([]);
  });

  it('finds gaps around a single booking', () => {
    expect(freeGaps([{ start: 60, end: 120 }], day, 30)).toEqual([
      { start: 0, end: 60 },
      { start: 120, end: 480 },
    ]);
  });

  it('finds gaps between multiple bookings', () => {
    expect(
      freeGaps(
        [
          { start: 60, end: 120 },
          { start: 300, end: 360 },
        ],
        day,
        30,
      ),
    ).toEqual([
      { start: 0, end: 60 },
      { start: 120, end: 300 },
      { start: 360, end: 480 },
    ]);
  });

  describe('minimum duration filter', () => {
    it('includes a gap of exactly minMinutes', () => {
      expect(
        freeGaps(
          [
            { start: 0, end: 100 },
            { start: 130, end: 480 },
          ],
          day,
          30,
        ),
      ).toEqual([{ start: 100, end: 130 }]);
    });

    it('excludes a gap one minute too short', () => {
      expect(
        freeGaps(
          [
            { start: 0, end: 100 },
            { start: 129, end: 480 },
          ],
          day,
          30,
        ),
      ).toEqual([]);
    });

    it('filters short gaps while keeping long ones', () => {
      expect(
        freeGaps(
          [
            { start: 0, end: 100 },
            { start: 110, end: 200 }, // 10-minute gap: too short
            { start: 260, end: 480 }, // 60-minute gap: qualifies
          ],
          day,
          30,
        ),
      ).toEqual([{ start: 200, end: 260 }]);
    });
  });

  describe('bookings vs working hours', () => {
    it('returns no gaps when bookings cover the whole day', () => {
      expect(
        freeGaps(
          [
            { start: 0, end: 240 },
            { start: 240, end: 480 },
          ],
          day,
          1,
        ),
      ).toEqual([]);
    });

    it('clamps a booking sticking out past both ends of the day', () => {
      expect(
        freeGaps(
          [
            { start: -100, end: 60 },
            { start: 400, end: 999 },
          ],
          day,
          30,
        ),
      ).toEqual([{ start: 60, end: 400 }]);
    });

    it('ignores bookings entirely outside working hours', () => {
      expect(
        freeGaps(
          [
            { start: 500, end: 600 },
            { start: 600, end: 700 },
          ],
          day,
          60,
        ),
      ).toEqual([{ start: 0, end: 480 }]);
    });
  });

  describe('messy input', () => {
    it('merges overlapping bookings before computing gaps', () => {
      expect(
        freeGaps(
          [
            { start: 60, end: 150 },
            { start: 100, end: 200 },
          ],
          day,
          30,
        ),
      ).toEqual([
        { start: 0, end: 60 },
        { start: 200, end: 480 },
      ]);
    });

    it('handles nested and identical bookings', () => {
      expect(
        freeGaps(
          [
            { start: 100, end: 300 },
            { start: 150, end: 200 },
            { start: 100, end: 300 },
          ],
          day,
          30,
        ),
      ).toEqual([
        { start: 0, end: 100 },
        { start: 300, end: 480 },
      ]);
    });

    it('treats touching bookings as one block with no gap between', () => {
      expect(
        freeGaps(
          [
            { start: 100, end: 200 },
            { start: 200, end: 300 },
          ],
          day,
          30,
        ),
      ).toEqual([
        { start: 0, end: 100 },
        { start: 300, end: 480 },
      ]);
    });

    it('handles unsorted input', () => {
      expect(
        freeGaps(
          [
            { start: 300, end: 360 },
            { start: 60, end: 120 },
          ],
          day,
          30,
        ),
      ).toEqual([
        { start: 0, end: 60 },
        { start: 120, end: 300 },
        { start: 360, end: 480 },
      ]);
    });

    it('does not mutate the inputs', () => {
      const booked: Interval[] = [
        { start: 300, end: 360 },
        { start: 60, end: 120 },
      ];
      const hours: Interval = { ...day };
      const bookedSnapshot = booked.map((b) => ({ ...b }));
      freeGaps(booked, hours, 30);
      expect(booked).toEqual(bookedSnapshot);
      expect(hours).toEqual(day);
    });
  });

  describe('large input', () => {
    it('finds qualifying gaps across 100k bookings', () => {
      const n = 100_000;
      const booked: Interval[] = [];
      // Booking i occupies [i*10, i*10 + 8) — a 2-minute gap after each,
      // except every 1000th booking is shortened to leave a 5-minute gap.
      for (let i = 0; i < n; i++) {
        const end = i % 1000 === 999 ? i * 10 + 5 : i * 10 + 8;
        booked.push({ start: i * 10, end });
      }
      const hours: Interval = { start: 0, end: n * 10 };
      const result = freeGaps(booked, hours, 5);
      expect(result).toHaveLength(100);
      expect(result[0]).toEqual({ start: 9995, end: 10_000 });
      expect(result[99]).toEqual({ start: 999_995, end: 1_000_000 });
    });
  });
});

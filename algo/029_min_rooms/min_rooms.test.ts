import { minRooms, Interval } from './min_rooms';

describe('minRooms', () => {
  it('returns 0 for no meetings', () => {
    expect(minRooms([])).toBe(0);
  });

  it('returns 1 for a single meeting', () => {
    expect(minRooms([{ start: 10, end: 20 }])).toBe(1);
  });

  it('returns 1 for disjoint meetings', () => {
    expect(
      minRooms([
        { start: 0, end: 10 },
        { start: 20, end: 30 },
        { start: 40, end: 50 },
      ]),
    ).toBe(1);
  });

  it('returns 2 for two overlapping meetings', () => {
    expect(
      minRooms([
        { start: 0, end: 30 },
        { start: 15, end: 45 },
      ]),
    ).toBe(2);
  });

  describe('boundary semantics', () => {
    it('reuses the room for back-to-back meetings', () => {
      expect(
        minRooms([
          { start: 0, end: 30 },
          { start: 30, end: 60 },
        ]),
      ).toBe(1);
    });

    it('reuses one room across a long back-to-back chain', () => {
      expect(
        minRooms([
          { start: 30, end: 40 },
          { start: 0, end: 10 },
          { start: 10, end: 20 },
          { start: 20, end: 30 },
        ]),
      ).toBe(1);
    });

    it('frees a room before seating a start at the same minute', () => {
      // At minute 30: one meeting ends, another starts — still only 2 rooms.
      expect(
        minRooms([
          { start: 0, end: 30 },
          { start: 15, end: 45 },
          { start: 30, end: 60 },
        ]),
      ).toBe(2);
    });

    it('needs a second room for a one-minute overlap', () => {
      expect(
        minRooms([
          { start: 0, end: 31 },
          { start: 30, end: 60 },
        ]),
      ).toBe(2);
    });
  });

  describe('edge shapes', () => {
    it('needs k rooms for k identical meetings', () => {
      const meeting: Interval = { start: 5, end: 15 };
      expect(minRooms([{ ...meeting }, { ...meeting }, { ...meeting }])).toBe(
        3,
      );
    });

    it('needs 2 rooms for a fully nested meeting', () => {
      expect(
        minRooms([
          { start: 0, end: 100 },
          { start: 40, end: 50 },
        ]),
      ).toBe(2);
    });

    it('counts a long meeting overlapping sequential short ones as 2', () => {
      expect(
        minRooms([
          { start: 0, end: 30 },
          { start: 5, end: 10 },
          { start: 15, end: 20 },
        ]),
      ).toBe(2);
    });

    it('finds the peak in a mixed unsorted schedule', () => {
      expect(
        minRooms([
          { start: 40, end: 60 },
          { start: 0, end: 10 },
          { start: 45, end: 50 }, // peak of 3 at 45–49
          { start: 42, end: 55 },
          { start: 5, end: 8 },
        ]),
      ).toBe(3);
    });
  });

  describe('purity', () => {
    it('does not mutate the input array', () => {
      const input: Interval[] = [
        { start: 15, end: 45 },
        { start: 0, end: 30 },
      ];
      const snapshot = input.map((m) => ({ ...m }));
      minRooms(input);
      expect(input).toEqual(snapshot);
    });
  });

  describe('large input', () => {
    it('handles 100k staggered meetings with a known peak', () => {
      const n = 100_000;
      const meetings: Interval[] = [];
      // Meeting i is [i, i + 10): at any minute t >= 9, exactly 10 meetings
      // are in progress, so the answer is 10.
      for (let i = 0; i < n; i++) {
        meetings.push({ start: i, end: i + 10 });
      }
      // Deterministic interleave so the input is not pre-sorted.
      const shuffled: Interval[] = [];
      for (let i = 0; i < n; i += 2) shuffled.push(meetings[i]);
      for (let i = 1; i < n; i += 2) shuffled.push(meetings[i]);
      expect(minRooms(shuffled)).toBe(10);
    });
  });
});

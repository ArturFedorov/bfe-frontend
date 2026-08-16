import { teamFreeTime, Interval } from './team_free_time';

describe('teamFreeTime', () => {
  it('returns [] for no calendars', () => {
    expect(teamFreeTime([])).toEqual([]);
  });

  it('returns [] when every calendar is empty', () => {
    expect(teamFreeTime([[], [], []])).toEqual([]);
  });

  it('returns [] for a single busy block (nothing to bound a gap)', () => {
    expect(teamFreeTime([[{ start: 0, end: 10 }]])).toEqual([]);
  });

  it('finds gaps within a single calendar', () => {
    expect(
      teamFreeTime([
        [
          { start: 0, end: 10 },
          { start: 20, end: 30 },
          { start: 50, end: 60 },
        ],
      ]),
    ).toEqual([
      { start: 10, end: 20 },
      { start: 30, end: 50 },
    ]);
  });

  it('finds common free time across three members', () => {
    expect(
      teamFreeTime([
        [
          { start: 1, end: 3 },
          { start: 6, end: 7 },
        ],
        [{ start: 2, end: 4 }],
        [{ start: 9, end: 12 }],
      ]),
    ).toEqual([
      { start: 4, end: 6 },
      { start: 7, end: 9 },
    ]);
  });

  describe('boundary semantics', () => {
    it('reports no gap when blocks touch across members', () => {
      expect(
        teamFreeTime([[{ start: 1, end: 3 }], [{ start: 3, end: 5 }]]),
      ).toEqual([]);
    });

    it('does not report the unbounded time before the first or after the last block', () => {
      expect(
        teamFreeTime([[{ start: 100, end: 200 }], [{ start: 300, end: 400 }]]),
      ).toEqual([{ start: 200, end: 300 }]);
    });

    it('reports a one-minute gap', () => {
      expect(
        teamFreeTime([[{ start: 0, end: 10 }], [{ start: 11, end: 20 }]]),
      ).toEqual([{ start: 10, end: 11 }]);
    });
  });

  describe('edge shapes', () => {
    it('handles identical intervals across members', () => {
      expect(
        teamFreeTime([
          [
            { start: 0, end: 10 },
            { start: 20, end: 30 },
          ],
          [
            { start: 0, end: 10 },
            { start: 20, end: 30 },
          ],
        ]),
      ).toEqual([{ start: 10, end: 20 }]);
    });

    it('handles fully nested intervals across members', () => {
      expect(
        teamFreeTime([
          [{ start: 0, end: 100 }],
          [
            { start: 40, end: 50 },
            { start: 150, end: 160 },
          ],
        ]),
      ).toEqual([{ start: 100, end: 150 }]);
    });

    it("lets one member's meeting fill another member's gap", () => {
      expect(
        teamFreeTime([
          [
            { start: 0, end: 10 },
            { start: 20, end: 30 },
          ],
          [{ start: 10, end: 20 }],
          [{ start: 40, end: 50 }],
        ]),
      ).toEqual([{ start: 30, end: 40 }]);
    });

    it('ignores members with empty calendars', () => {
      expect(
        teamFreeTime([
          [],
          [
            { start: 0, end: 10 },
            { start: 30, end: 40 },
          ],
          [],
        ]),
      ).toEqual([{ start: 10, end: 30 }]);
    });
  });

  describe('purity', () => {
    it('does not mutate the input calendars', () => {
      const calendars: Interval[][] = [
        [
          { start: 1, end: 3 },
          { start: 6, end: 7 },
        ],
        [{ start: 2, end: 4 }],
      ];
      const snapshot = calendars.map((cal) => cal.map((b) => ({ ...b })));
      teamFreeTime(calendars);
      expect(calendars).toEqual(snapshot);
    });
  });

  describe('large input', () => {
    it('handles 100 calendars with 1000 intervals each (100k total)', () => {
      const k = 100;
      const perMember = 1000;
      const calendars: Interval[][] = [];
      // Every member is busy [i*1000, i*1000 + 500) for i in 0..999,
      // so the merged busy blocks are those same intervals and the free
      // gaps are [i*1000 + 500, (i+1)*1000) for i in 0..998.
      for (let m = 0; m < k; m++) {
        const calendar: Interval[] = [];
        for (let i = 0; i < perMember; i++) {
          calendar.push({ start: i * 1000, end: i * 1000 + 500 });
        }
        calendars.push(calendar);
      }
      const result = teamFreeTime(calendars);
      expect(result).toHaveLength(perMember - 1);
      expect(result[0]).toEqual({ start: 500, end: 1000 });
      expect(result[499]).toEqual({ start: 499_500, end: 500_000 });
      expect(result[998]).toEqual({ start: 998_500, end: 999_000 });
    });
  });
});

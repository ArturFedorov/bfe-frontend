import { insertMeeting, Interval } from './insert_meeting';

describe('insertMeeting', () => {
  it('inserts into an empty calendar', () => {
    expect(insertMeeting([], { start: 10, end: 20 })).toEqual([
      { start: 10, end: 20 },
    ]);
  });

  it('inserts before all existing blocks', () => {
    expect(
      insertMeeting(
        [
          { start: 30, end: 40 },
          { start: 50, end: 60 },
        ],
        { start: 0, end: 10 },
      ),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 30, end: 40 },
      { start: 50, end: 60 },
    ]);
  });

  it('inserts after all existing blocks', () => {
    expect(
      insertMeeting(
        [
          { start: 0, end: 10 },
          { start: 20, end: 30 },
        ],
        { start: 50, end: 60 },
      ),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
      { start: 50, end: 60 },
    ]);
  });

  it('inserts into a gap without overlapping anything', () => {
    expect(
      insertMeeting(
        [
          { start: 0, end: 10 },
          { start: 30, end: 40 },
        ],
        { start: 15, end: 20 },
      ),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 15, end: 20 },
      { start: 30, end: 40 },
    ]);
  });

  describe('overlap merging', () => {
    it('merges with a single overlapping block', () => {
      expect(
        insertMeeting(
          [
            { start: 0, end: 10 },
            { start: 30, end: 40 },
          ],
          { start: 5, end: 15 },
        ),
      ).toEqual([
        { start: 0, end: 15 },
        { start: 30, end: 40 },
      ]);
    });

    it('merges across multiple blocks and the gaps between them', () => {
      expect(
        insertMeeting(
          [
            { start: 0, end: 10 },
            { start: 20, end: 30 },
            { start: 40, end: 50 },
            { start: 70, end: 80 },
          ],
          { start: 5, end: 45 },
        ),
      ).toEqual([
        { start: 0, end: 50 },
        { start: 70, end: 80 },
      ]);
    });

    it('swallows the whole calendar when the meeting spans everything', () => {
      expect(
        insertMeeting(
          [
            { start: 10, end: 20 },
            { start: 30, end: 40 },
          ],
          { start: 0, end: 100 },
        ),
      ).toEqual([{ start: 0, end: 100 }]);
    });

    it('disappears into an existing block when fully nested', () => {
      expect(
        insertMeeting([{ start: 0, end: 100 }], { start: 40, end: 50 }),
      ).toEqual([{ start: 0, end: 100 }]);
    });

    it('handles a meeting identical to an existing block', () => {
      expect(
        insertMeeting(
          [
            { start: 0, end: 10 },
            { start: 20, end: 30 },
          ],
          { start: 20, end: 30 },
        ),
      ).toEqual([
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ]);
    });
  });

  describe('touching boundaries', () => {
    it('merges when the meeting touches a block on its left', () => {
      expect(
        insertMeeting([{ start: 0, end: 10 }], { start: 10, end: 20 }),
      ).toEqual([{ start: 0, end: 20 }]);
    });

    it('merges when the meeting touches a block on its right', () => {
      expect(
        insertMeeting([{ start: 20, end: 30 }], { start: 10, end: 20 }),
      ).toEqual([{ start: 10, end: 30 }]);
    });

    it('bridges two blocks when touching on both sides', () => {
      expect(
        insertMeeting(
          [
            { start: 0, end: 10 },
            { start: 20, end: 30 },
          ],
          { start: 10, end: 20 },
        ),
      ).toEqual([{ start: 0, end: 30 }]);
    });

    it('does not merge across a one-minute gap', () => {
      expect(
        insertMeeting([{ start: 0, end: 10 }], { start: 11, end: 20 }),
      ).toEqual([
        { start: 0, end: 10 },
        { start: 11, end: 20 },
      ]);
    });
  });

  describe('purity', () => {
    it('does not mutate the calendar or the meeting', () => {
      const calendar: Interval[] = [
        { start: 0, end: 10 },
        { start: 30, end: 40 },
      ];
      const meeting: Interval = { start: 5, end: 35 };
      const calendarSnapshot = calendar.map((b) => ({ ...b }));
      const meetingSnapshot = { ...meeting };
      insertMeeting(calendar, meeting);
      expect(calendar).toEqual(calendarSnapshot);
      expect(meeting).toEqual(meetingSnapshot);
    });
  });

  describe('large input', () => {
    const n = 100_000;
    const buildCalendar = (): Interval[] => {
      const calendar: Interval[] = [];
      for (let i = 0; i < n; i++) {
        // Blocks [i*10, i*10 + 5), gaps of 5 between them.
        calendar.push({ start: i * 10, end: i * 10 + 5 });
      }
      return calendar;
    };

    it('inserts into a gap of a 100k-block calendar', () => {
      const result = insertMeeting(buildCalendar(), {
        start: 500_006,
        end: 500_009,
      });
      expect(result).toHaveLength(n + 1);
      expect(result[50_001]).toEqual({ start: 500_006, end: 500_009 });
      expect(result[50_002]).toEqual({ start: 500_010, end: 500_015 });
    });

    it('merges a long span across thousands of blocks', () => {
      // Covers blocks 10_000..19_999 plus their gaps.
      const result = insertMeeting(buildCalendar(), {
        start: 100_000,
        end: 199_995,
      });
      expect(result).toHaveLength(n - 10_000 + 1);
      expect(result[10_000]).toEqual({ start: 100_000, end: 199_995 });
      expect(result[9_999]).toEqual({ start: 99_990, end: 99_995 });
      expect(result[10_001]).toEqual({ start: 200_000, end: 200_005 });
    });
  });
});

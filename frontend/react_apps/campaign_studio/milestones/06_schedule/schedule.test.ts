import {
  isQuiet,
  MINUTES_PER_DAY,
  MINUTES_PER_WEEK,
  minuteOfWeek,
  nextAllowed,
  nextSends,
  normalizeQuietHours,
  parseHHmm,
  zonedParts,
  zonedTimeToUtc,
  type Schedule,
} from './schedule';

const NY = 'America/New_York';

describe('schedule — time helpers', () => {
  it('parseHHmm returns minutes since midnight and rejects garbage', () => {
    expect(parseHHmm('00:00')).toBe(0);
    expect(parseHHmm('09:30')).toBe(570);
    expect(parseHHmm('23:59')).toBe(1439);
    expect(() => parseHHmm('24:00')).toThrow();
    expect(() => parseHHmm('9h30')).toThrow();
  });

  it('zonedParts reads the wall clock in UTC, New York (both sides of DST) and Kolkata', () => {
    expect(zonedParts(new Date('2026-03-08T06:59:00Z'), 'UTC')).toEqual({
      year: 2026,
      month: 3,
      day: 8,
      hour: 6,
      minute: 59,
      weekday: 0,
    });
    // 06:59Z is 01:59 EST, one minute before the spring-forward gap
    expect(zonedParts(new Date('2026-03-08T06:59:00Z'), NY)).toMatchObject({
      hour: 1,
      minute: 59,
      weekday: 0,
    });
    // 07:00Z is 03:00 EDT — 02:xx never happens that morning
    expect(zonedParts(new Date('2026-03-08T07:00:00Z'), NY)).toMatchObject({
      day: 8,
      hour: 3,
      minute: 0,
    });
    // Fall back: 05:30Z is 01:30 EDT, 06:30Z is 01:30 EST again
    expect(zonedParts(new Date('2026-11-01T05:30:00Z'), NY)).toMatchObject({
      day: 1,
      hour: 1,
      minute: 30,
    });
    expect(zonedParts(new Date('2026-11-01T06:30:00Z'), NY)).toMatchObject({
      day: 1,
      hour: 1,
      minute: 30,
    });
    // Kolkata is +05:30 all year, and midnight there is a different calendar day
    expect(
      zonedParts(new Date('2026-06-15T18:45:00Z'), 'Asia/Kolkata'),
    ).toMatchObject({
      month: 6,
      day: 16,
      hour: 0,
      minute: 15,
      weekday: 2,
    });
  });

  it('zonedTimeToUtc round-trips and resolves DST gaps (later) and overlaps (earlier)', () => {
    expect(
      zonedTimeToUtc(
        { year: 2026, month: 6, day: 15, hour: 9, minute: 30 },
        'UTC',
      ).toISOString(),
    ).toBe('2026-06-15T09:30:00.000Z');
    expect(
      zonedTimeToUtc(
        { year: 2026, month: 6, day: 15, hour: 9, minute: 30 },
        NY,
      ).toISOString(),
    ).toBe('2026-06-15T13:30:00.000Z');
    expect(
      zonedTimeToUtc(
        { year: 2026, month: 1, day: 15, hour: 9, minute: 30 },
        NY,
      ).toISOString(),
    ).toBe('2026-01-15T14:30:00.000Z');
    expect(
      zonedTimeToUtc(
        { year: 2026, month: 6, day: 16, hour: 0, minute: 15 },
        'Asia/Kolkata',
      ).toISOString(),
    ).toBe('2026-06-15T18:45:00.000Z');
    // gap: 02:30 does not exist on 2026-03-08 in New York → one hour later (03:30 EDT)
    expect(
      zonedTimeToUtc(
        { year: 2026, month: 3, day: 8, hour: 2, minute: 30 },
        NY,
      ).toISOString(),
    ).toBe('2026-03-08T07:30:00.000Z');
    // overlap: 01:30 happens twice on 2026-11-01 → the earlier (EDT) instant
    expect(
      zonedTimeToUtc(
        { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
        NY,
      ).toISOString(),
    ).toBe('2026-11-01T05:30:00.000Z');
    // round-trip through zonedParts for an ordinary instant
    const instant = new Date('2026-10-20T17:05:00Z');
    const { weekday, ...parts } = zonedParts(instant, NY);
    void weekday;
    expect(zonedTimeToUtc(parts, NY).getTime()).toBe(instant.getTime());
  });

  it('minuteOfWeek counts from Sunday 00:00 in the zone', () => {
    // Sunday 00:00Z
    expect(minuteOfWeek(new Date('2026-06-14T00:00:00Z'), 'UTC')).toBe(0);
    // Monday 09:30 EDT = Monday 13:30Z
    expect(minuteOfWeek(new Date('2026-06-15T13:30:00Z'), NY)).toBe(
      1 * MINUTES_PER_DAY + 570,
    );
    // Saturday 23:59Z is still Saturday in UTC, but already Sunday 05:29 in Kolkata
    expect(minuteOfWeek(new Date('2026-06-20T23:59:00Z'), 'UTC')).toBe(
      MINUTES_PER_WEEK - 1,
    );
    expect(minuteOfWeek(new Date('2026-06-20T23:59:00Z'), 'Asia/Kolkata')).toBe(
      5 * 60 + 29,
    );
  });
});

describe('schedule — quiet hours over minutes of the week', () => {
  it('normalizeQuietHours sorts, merges overlaps and adjacent ranges, and expands days=[] to every day', () => {
    expect(normalizeQuietHours([])).toEqual([]);
    expect(
      normalizeQuietHours([
        { days: [2], start: '12:00', end: '13:00' },
        { days: [1], start: '09:00', end: '10:00' },
        { days: [1], start: '09:30', end: '11:00' }, // overlaps the previous
        { days: [1], start: '11:00', end: '11:30' }, // adjacent → merges
      ]),
    ).toEqual([
      { start: 1 * MINUTES_PER_DAY + 540, end: 1 * MINUTES_PER_DAY + 690 },
      { start: 2 * MINUTES_PER_DAY + 720, end: 2 * MINUTES_PER_DAY + 780 },
    ]);
    const everyDay = normalizeQuietHours([
      { days: [], start: '01:00', end: '02:00' },
    ]);
    expect(everyDay).toHaveLength(7);
    expect(everyDay.map((r) => r.start)).toEqual(
      [0, 1, 2, 3, 4, 5, 6].map((d) => d * MINUTES_PER_DAY + 60),
    );

    // a window that wraps midnight splits at the day boundary; Saturday night lands on Sunday morning
    expect(
      normalizeQuietHours([{ days: [3], start: '22:00', end: '06:00' }]),
    ).toEqual(
      [
        { start: 3 * MINUTES_PER_DAY + 1320, end: 4 * MINUTES_PER_DAY },
        { start: 4 * MINUTES_PER_DAY, end: 4 * MINUTES_PER_DAY + 360 },
      ].reduce<{ start: number; end: number }[]>((acc, r) => {
        // adjacent halves merge back into one range across the day boundary
        const last = acc[acc.length - 1];
        if (last && last.end === r.start) last.end = r.end;
        else acc.push(r);
        return acc;
      }, []),
    );
    expect(
      normalizeQuietHours([{ days: [6], start: '23:00', end: '01:00' }]),
    ).toEqual([
      { start: 0, end: 60 },
      { start: 6 * MINUTES_PER_DAY + 1380, end: MINUTES_PER_WEEK },
    ]);
  });

  it('isQuiet does a half-open lookup and takes the minute modulo the week', () => {
    const ranges = normalizeQuietHours([
      { days: [1], start: '09:00', end: '10:00' },
    ]);
    const monday9 = MINUTES_PER_DAY + 540;
    expect(isQuiet(ranges, monday9 - 1)).toBe(false);
    expect(isQuiet(ranges, monday9)).toBe(true);
    expect(isQuiet(ranges, monday9 + 59)).toBe(true);
    expect(isQuiet(ranges, monday9 + 60)).toBe(false);
    expect(isQuiet(ranges, monday9 + MINUTES_PER_WEEK)).toBe(true);
    expect(isQuiet([], 123)).toBe(false);
  });

  it('nextAllowed returns the input when allowed, skips a range, wraps past the week end, and throws on full coverage', () => {
    const ranges = normalizeQuietHours([
      { days: [1], start: '09:00', end: '10:00' },
      { days: [6], start: '22:00', end: '03:00' }, // Sat 22:00 → Sun 03:00
      { days: [0], start: '03:00', end: '04:00' }, // adjacent on Sunday → Sun 00:00-04:00
    ]);
    const monday9 = MINUTES_PER_DAY + 540;
    expect(nextAllowed(ranges, monday9 - 1)).toBe(monday9 - 1);
    expect(nextAllowed(ranges, monday9)).toBe(monday9 + 60);
    expect(nextAllowed(ranges, monday9 + 30)).toBe(monday9 + 60);
    // Saturday 23:00 → quiet until Sunday 04:00 (wraps through the week end)
    expect(nextAllowed(ranges, 6 * MINUTES_PER_DAY + 1380)).toBe(240);
    expect(nextAllowed(ranges, MINUTES_PER_WEEK + 10)).toBe(240); // modulo
    expect(() =>
      nextAllowed([{ start: 0, end: MINUTES_PER_WEEK }], 500),
    ).toThrow(/whole week/i);
  });
});

describe('schedule — nextSends', () => {
  const base: Schedule = {
    timezone: 'UTC',
    startDate: '2026-06-01',
    time: '07:00',
    recurrence: 'daily',
    quietHours: [],
  };

  it('daily in UTC: strictly after now, in order, exactly count results', () => {
    const now = new Date('2026-06-10T07:00:00Z'); // exactly at a send → that one is excluded
    expect(nextSends(base, now, 3).map((d) => d.toISOString())).toEqual([
      '2026-06-11T07:00:00.000Z',
      '2026-06-12T07:00:00.000Z',
      '2026-06-13T07:00:00.000Z',
    ]);
    // before startDate: the first send is on startDate itself
    expect(
      nextSends(base, new Date('2026-01-01T00:00:00Z'), 1).map((d) =>
        d.toISOString(),
      ),
    ).toEqual(['2026-06-01T07:00:00.000Z']);
    expect(nextSends(base, now, 0)).toEqual([]);
  });

  it('weekly Mon/Wed/Fri 09:30 in New York keeps the local time across the November DST change', () => {
    const schedule: Schedule = {
      timezone: NY,
      startDate: '2026-10-26',
      time: '09:30',
      recurrence: 'weekly',
      weekdays: [1, 3, 5],
      quietHours: [],
    };
    const sends = nextSends(schedule, new Date('2026-10-28T00:00:00Z'), 4);
    expect(sends.map((d) => d.toISOString())).toEqual([
      '2026-10-28T13:30:00.000Z', // Wed, EDT
      '2026-10-30T13:30:00.000Z', // Fri, EDT
      '2026-11-02T14:30:00.000Z', // Mon, EST — UTC shifts, wall clock does not
      '2026-11-04T14:30:00.000Z', // Wed, EST
    ]);
    expect(sends.map((d) => zonedParts(d, NY))).toEqual(
      sends.map((d) =>
        expect.objectContaining({
          hour: 9,
          minute: 30,
          weekday: zonedParts(d, NY).weekday,
        }),
      ),
    );
    expect(sends.map((d) => zonedParts(d, NY).weekday)).toEqual([3, 5, 1, 3]);
    expect(
      nextSends(
        { ...schedule, weekdays: [] },
        new Date('2026-10-28T00:00:00Z'),
        3,
      ),
    ).toEqual([]);
  });

  it('once: a single send, nothing when it is already in the past', () => {
    const once: Schedule = {
      ...base,
      recurrence: 'once',
      startDate: '2026-06-01',
      time: '07:00',
    };
    expect(
      nextSends(once, new Date('2026-05-31T00:00:00Z'), 5).map((d) =>
        d.toISOString(),
      ),
    ).toEqual(['2026-06-01T07:00:00.000Z']);
    expect(nextSends(once, new Date('2026-06-01T07:00:00Z'), 5)).toEqual([]);
    expect(nextSends(once, new Date('2027-01-01T00:00:00Z'), 5)).toEqual([]);
  });

  it('quiet hours push a candidate to the next allowed minute and collapse duplicates', () => {
    const quiet: Schedule = {
      ...base,
      quietHours: [{ days: [], start: '06:00', end: '08:00' }],
    };
    expect(
      nextSends(quiet, new Date('2026-06-10T00:00:00Z'), 2).map((d) =>
        d.toISOString(),
      ),
    ).toEqual(['2026-06-10T08:00:00.000Z', '2026-06-11T08:00:00.000Z']);
    // Mon 2026-06-08 and Tue 2026-06-09 are entirely quiet (end === start wraps a full 24h):
    // both 07:00 candidates land on Wed 00:00 and are reported once.
    const twoDays: Schedule = {
      ...base,
      quietHours: [{ days: [1, 2], start: '00:00', end: '00:00' }],
    };
    expect(
      nextSends(twoDays, new Date('2026-06-07T12:00:00Z'), 3).map((d) =>
        d.toISOString(),
      ),
    ).toEqual([
      '2026-06-10T00:00:00.000Z',
      '2026-06-10T07:00:00.000Z',
      '2026-06-11T07:00:00.000Z',
    ]);
  });
});

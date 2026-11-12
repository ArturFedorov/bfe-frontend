import {
  WEEK_MINUTES,
  Window,
  normalize,
  isQuiet,
  nextAllowed,
  fromDate,
  toMinutes,
} from './quiet_hours_merge';

const DAY = 24 * 60;

describe('toMinutes', () => {
  it('parses day and time into minutes since Monday 00:00', () => {
    expect(toMinutes('Mon 00:00')).toBe(0);
    expect(toMinutes('Mon 07:30')).toBe(450);
    expect(toMinutes('Tue 22:00')).toBe(DAY + 22 * 60);
    expect(toMinutes('Sun 23:59')).toBe(WEEK_MINUTES - 1);
  });

  it('throws RangeError on a malformed label', () => {
    expect(() => toMinutes('Funday 10:00')).toThrow(RangeError);
    expect(() => toMinutes('Mon 25:00')).toThrow(RangeError);
    expect(() => toMinutes('Mon')).toThrow(RangeError);
  });
});

describe('fromDate', () => {
  it('uses UTC getters with Monday as day 0', () => {
    // 2026-11-10 is a Tuesday
    expect(fromDate(new Date('2026-11-10T22:00:00Z'))).toBe(toMinutes('Tue 22:00'));
    // 2026-11-15 is a Sunday
    expect(fromDate(new Date('2026-11-15T23:59:00Z'))).toBe(WEEK_MINUTES - 1);
    // 2026-11-09 is a Monday
    expect(fromDate(new Date('2026-11-09T00:00:00Z'))).toBe(0);
  });
});

describe('normalize', () => {
  it('sorts and merges overlapping windows', () => {
    const raw: Window[] = [
      { start: 600, end: 700 },
      { start: 100, end: 300 },
      { start: 250, end: 400 },
    ];
    expect(normalize(raw)).toEqual([
      { start: 100, end: 400 },
      { start: 600, end: 700 },
    ]);
  });

  it('merges adjacent windows into one', () => {
    expect(
      normalize([
        { start: 0, end: 60 },
        { start: 60, end: 120 },
        { start: 120, end: 180 },
      ]),
    ).toEqual([{ start: 0, end: 180 }]);
  });

  it('splits a window that crosses Sunday -> Monday', () => {
    const sunNight = { start: toMinutes('Sun 23:00'), end: WEEK_MINUTES + 60 };
    expect(normalize([sunNight])).toEqual([
      { start: 0, end: 60 },
      { start: toMinutes('Sun 23:00'), end: WEEK_MINUTES },
    ]);
  });

  it('merges the wrapped piece with a Monday-morning window', () => {
    const q = normalize([
      { start: toMinutes('Mon 00:30'), end: toMinutes('Mon 07:00') },
      { start: toMinutes('Sun 22:00'), end: WEEK_MINUTES + 60 },
    ]);
    expect(q).toEqual([
      { start: 0, end: toMinutes('Mon 07:00') },
      { start: toMinutes('Sun 22:00'), end: WEEK_MINUTES },
    ]);
  });

  it('drops empty windows and returns [] for no windows', () => {
    expect(normalize([])).toEqual([]);
    expect(normalize([{ start: 500, end: 500 }])).toEqual([]);
  });

  it('collapses a full-week window to [0, 10080)', () => {
    expect(normalize([{ start: 3000, end: 3000 + WEEK_MINUTES }])).toEqual([
      { start: 0, end: WEEK_MINUTES },
    ]);
  });

  it('is idempotent', () => {
    const once = normalize([
      { start: 9000, end: 11000 },
      { start: 1500, end: 1600 },
      { start: 1600, end: 1700 },
    ]);
    expect(normalize(once)).toEqual(once);
  });

  it('does not mutate the input', () => {
    const raw: Window[] = [
      { start: 600, end: 700 },
      { start: 100, end: 300 },
    ];
    const copy = raw.map((w) => ({ ...w }));
    normalize(raw);
    expect(raw).toEqual(copy);
  });

  it('throws RangeError on out-of-bounds windows', () => {
    expect(() => normalize([{ start: -1, end: 10 }])).toThrow(RangeError);
    expect(() => normalize([{ start: WEEK_MINUTES, end: WEEK_MINUTES + 5 }])).toThrow(
      RangeError,
    );
    expect(() => normalize([{ start: 100, end: 50 }])).toThrow(RangeError);
    expect(() => normalize([{ start: 0, end: WEEK_MINUTES + 1 }])).toThrow(RangeError);
  });
});

describe('isQuiet', () => {
  let q: Window[];
  beforeAll(() => {
    q = normalize([
      { start: toMinutes('Mon 22:00'), end: toMinutes('Tue 07:00') },
      { start: toMinutes('Tue 22:00'), end: toMinutes('Wed 07:00') },
      { start: toMinutes('Sun 22:00'), end: WEEK_MINUTES + 7 * 60 },
    ]);
  });

  it('reports minutes inside a window as quiet', () => {
    expect(isQuiet(q, toMinutes('Mon 23:30'))).toBe(true);
    expect(isQuiet(q, toMinutes('Tue 03:00'))).toBe(true);
    expect(isQuiet(q, toMinutes('Sun 23:59'))).toBe(true);
    expect(isQuiet(q, toMinutes('Mon 03:00'))).toBe(true);
  });

  it('treats start as inclusive and end as exclusive', () => {
    expect(isQuiet(q, toMinutes('Mon 22:00'))).toBe(true);
    expect(isQuiet(q, toMinutes('Tue 07:00'))).toBe(false);
    expect(isQuiet(q, toMinutes('Tue 06:59'))).toBe(true);
  });

  it('reports minutes outside every window as allowed', () => {
    expect(isQuiet(q, toMinutes('Tue 12:00'))).toBe(false);
    expect(isQuiet(q, toMinutes('Thu 00:00'))).toBe(false);
    expect(isQuiet([], 0)).toBe(false);
  });

  it('answers 200k queries over 5k windows quickly (binary search)', () => {
    const raw: Window[] = Array.from({ length: 10_000 }, (_, i) => ({
      start: i,
      end: i + 1,
    })).filter((_, i) => i % 2 === 0); // 5000 disjoint one-minute windows
    const sparse = normalize(raw);
    expect(sparse).toHaveLength(5000);

    const startedAt = Date.now();
    let quiet = 0;
    for (let m = 0; m < 200_000; m++) if (isQuiet(sparse, m % WEEK_MINUTES)) quiet++;
    expect(Date.now() - startedAt).toBeLessThan(1000);
    // minutes 0..9999 (even ones quiet) repeated ~19.8 times in 200k queries
    expect(quiet).toBeGreaterThan(0);
  });
});

describe('nextAllowed', () => {
  let q: Window[];
  beforeAll(() => {
    q = normalize([
      { start: toMinutes('Mon 22:00'), end: toMinutes('Tue 07:00') },
      { start: toMinutes('Sun 22:00'), end: WEEK_MINUTES + 7 * 60 },
    ]);
  });

  it('returns the same minute when it is already allowed', () => {
    expect(nextAllowed(q, toMinutes('Tue 12:00'))).toBe(toMinutes('Tue 12:00'));
    expect(nextAllowed([], 1234)).toBe(1234);
  });

  it('returns the end of the covering window', () => {
    expect(nextAllowed(q, toMinutes('Mon 23:30'))).toBe(toMinutes('Tue 07:00'));
    expect(nextAllowed(q, toMinutes('Mon 22:00'))).toBe(toMinutes('Tue 07:00'));
  });

  it('wraps Sunday night into Monday morning (modulo 10080)', () => {
    expect(nextAllowed(q, toMinutes('Sun 23:00'))).toBe(toMinutes('Mon 07:00'));
    expect(nextAllowed(q, toMinutes('Mon 02:00'))).toBe(toMinutes('Mon 07:00'));
  });

  it('wraps to minute 0 when the Sunday window ends exactly at midnight', () => {
    const q2 = normalize([{ start: toMinutes('Sun 22:00'), end: WEEK_MINUTES }]);
    expect(nextAllowed(q2, toMinutes('Sun 23:00'))).toBe(0);
  });

  it('throws RangeError when the whole week is quiet', () => {
    const full = normalize([{ start: 0, end: WEEK_MINUTES }]);
    expect(() => nextAllowed(full, 0)).toThrow(RangeError);
    expect(() => nextAllowed(full, 5000)).toThrow(RangeError);

    const stitched = normalize([
      { start: 0, end: 5000 },
      { start: 5000, end: WEEK_MINUTES },
    ]);
    expect(() => nextAllowed(stitched, 42)).toThrow(RangeError);
  });
});

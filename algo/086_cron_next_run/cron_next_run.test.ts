import { parseCron, matches, nextRuns, CronSpec } from './cron_next_run';

const range = (lo: number, hi: number): number[] =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

const iso = (dates: Date[]): string[] => dates.map((d) => d.toISOString());
const utc = (s: string): Date => new Date(s);

describe('parseCron', () => {
  it('expands * to the full range and marks dom/dow unrestricted', () => {
    expect(parseCron('* * * * *')).toEqual<CronSpec>({
      minute: range(0, 59),
      hour: range(0, 23),
      dayOfMonth: range(1, 31),
      month: range(1, 12),
      dayOfWeek: range(0, 6),
      domRestricted: false,
      dowRestricted: false,
    });
  });

  it('parses values, lists, ranges and steps', () => {
    expect(parseCron('*/15 9-17 1,15 * 1-5')).toEqual<CronSpec>({
      minute: [0, 15, 30, 45],
      hour: range(9, 17),
      dayOfMonth: [1, 15],
      month: range(1, 12),
      dayOfWeek: [1, 2, 3, 4, 5],
      domRestricted: true,
      dowRestricted: true,
    });
  });

  it('supports ranged steps and mixed lists, sorted and de-duplicated', () => {
    expect(parseCron('0 0 1-30/5 * *').dayOfMonth).toEqual([
      1, 6, 11, 16, 21, 26,
    ]);
    expect(parseCron('5,1,1-2,*/30 * * * *').minute).toEqual([0, 1, 2, 5, 30]);
    expect(parseCron('0 22-23,0-1 * * *').hour).toEqual([0, 1, 22, 23]);
  });

  it('tolerates extra whitespace', () => {
    expect(parseCron('  0   9 *  *   1-5 ').hour).toEqual([9]);
  });

  it('treats anything other than exactly * as restricted', () => {
    expect(parseCron('0 0 */2 * *').domRestricted).toBe(true);
    expect(parseCron('0 0 * * 0-6').dowRestricted).toBe(true);
    expect(parseCron('0 0 1-31 * *').domRestricted).toBe(true);
  });

  it('throws SyntaxError on a wrong field count', () => {
    expect(() => parseCron('0 9 * *')).toThrow(SyntaxError);
    expect(() => parseCron('0 9 * * * *')).toThrow(SyntaxError);
    expect(() => parseCron('')).toThrow(SyntaxError);
  });

  it('throws SyntaxError on out-of-range values', () => {
    expect(() => parseCron('60 * * * *')).toThrow(SyntaxError);
    expect(() => parseCron('* 24 * * *')).toThrow(SyntaxError);
    expect(() => parseCron('* * 0 * *')).toThrow(SyntaxError);
    expect(() => parseCron('* * 32 * *')).toThrow(SyntaxError);
    expect(() => parseCron('* * * 0 *')).toThrow(SyntaxError);
    expect(() => parseCron('* * * 13 *')).toThrow(SyntaxError);
    expect(() => parseCron('* * * * 7')).toThrow(SyntaxError);
    expect(() => parseCron('* * * * 1-7')).toThrow(SyntaxError);
  });

  it('throws SyntaxError on malformed tokens', () => {
    for (const bad of [
      'abc * * * *',
      '5-1 * * * *',
      '*/0 * * * *',
      '1- * * * *',
      '-5 * * * *',
      '1,,2 * * * *',
      '* * * MON *',
      '*/a * * * *',
      '5/3 * * * *',
    ]) {
      expect(() => parseCron(bad)).toThrow(SyntaxError);
    }
  });
});

describe('matches', () => {
  it('matches on UTC fields and ignores seconds', () => {
    const spec = parseCron('30 9 * * *');
    expect(matches(spec, utc('2025-01-01T09:30:00Z'))).toBe(true);
    expect(matches(spec, utc('2025-01-01T09:30:45.999Z'))).toBe(true);
    expect(matches(spec, utc('2025-01-01T09:31:00Z'))).toBe(false);
    expect(matches(spec, utc('2025-01-01T10:30:00Z'))).toBe(false);
  });

  it('checks month and day-of-month', () => {
    const spec = parseCron('0 0 15 6 *');
    expect(matches(spec, utc('2025-06-15T00:00:00Z'))).toBe(true);
    expect(matches(spec, utc('2025-07-15T00:00:00Z'))).toBe(false);
    expect(matches(spec, utc('2025-06-14T00:00:00Z'))).toBe(false);
  });

  it('day-of-week alone restricts to those weekdays (0 = Sunday)', () => {
    const spec = parseCron('0 9 * * 0');
    expect(matches(spec, utc('2025-01-05T09:00:00Z'))).toBe(true); // Sunday
    expect(matches(spec, utc('2025-01-06T09:00:00Z'))).toBe(false); // Monday
  });

  it('day-of-month alone does NOT fire every day just because dow is *', () => {
    const spec = parseCron('0 9 15 * *');
    expect(matches(spec, utc('2025-01-15T09:00:00Z'))).toBe(true);
    expect(matches(spec, utc('2025-01-16T09:00:00Z'))).toBe(false);
  });

  it('when both dom and dow are restricted, EITHER may match (Vixie semantics)', () => {
    const spec = parseCron('0 9 1 * 1'); // 1st of month OR Monday
    expect(matches(spec, utc('2025-01-01T09:00:00Z'))).toBe(true); // Wed the 1st
    expect(matches(spec, utc('2025-01-06T09:00:00Z'))).toBe(true); // Monday the 6th
    expect(matches(spec, utc('2025-01-07T09:00:00Z'))).toBe(false); // Tuesday the 7th
  });
});

describe('nextRuns — stepping', () => {
  it('*/15 from 09:07 goes to 09:15 and keeps stepping', () => {
    expect(
      iso(nextRuns('*/15 * * * *', utc('2025-01-01T09:07:00Z'), 4)),
    ).toEqual([
      '2025-01-01T09:15:00.000Z',
      '2025-01-01T09:30:00.000Z',
      '2025-01-01T09:45:00.000Z',
      '2025-01-01T10:00:00.000Z',
    ]);
  });

  it('is strictly after from: an exact match at from is excluded', () => {
    expect(iso(nextRuns('0 9 * * *', utc('2025-01-01T09:00:00Z'), 1))).toEqual([
      '2025-01-02T09:00:00.000Z',
    ]);
    expect(iso(nextRuns('0 9 * * *', utc('2025-01-01T09:00:30Z'), 1))).toEqual([
      '2025-01-02T09:00:00.000Z',
    ]);
    expect(iso(nextRuns('0 9 * * *', utc('2025-01-01T08:59:59Z'), 1))).toEqual([
      '2025-01-01T09:00:00.000Z',
    ]);
  });

  it('resets minutes when jumping to a later hour', () => {
    expect(
      iso(nextRuns('5,50 10 * * *', utc('2025-01-01T09:55:00Z'), 2)),
    ).toEqual(['2025-01-01T10:05:00.000Z', '2025-01-01T10:50:00.000Z']);
  });

  it('rolls over to the next day when today has no remaining candidates', () => {
    expect(iso(nextRuns('30 8 * * *', utc('2025-01-31T09:00:00Z'), 2))).toEqual(
      ['2025-02-01T08:30:00.000Z', '2025-02-02T08:30:00.000Z'],
    );
  });

  it('returns [] for count <= 0 and does not mutate from', () => {
    const from = utc('2025-01-01T09:07:00Z');
    const stamp = from.getTime();
    expect(nextRuns('* * * * *', from, 0)).toEqual([]);
    expect(nextRuns('* * * * *', from, -3)).toEqual([]);
    nextRuns('*/15 * * * *', from, 5);
    expect(from.getTime()).toBe(stamp);
  });
});

describe('nextRuns — calendar', () => {
  it('weekdays at 09:00 skip the weekend', () => {
    expect(
      iso(nextRuns('0 9 * * 1-5', utc('2025-01-03T10:00:00Z'), 3)),
    ).toEqual([
      '2025-01-06T09:00:00.000Z', // Mon
      '2025-01-07T09:00:00.000Z',
      '2025-01-08T09:00:00.000Z',
    ]);
  });

  it('dom OR dow: fires on the 1st and on every Monday', () => {
    expect(iso(nextRuns('0 9 1 * 1', utc('2025-01-01T00:00:00Z'), 7))).toEqual([
      '2025-01-01T09:00:00.000Z', // Wed, 1st
      '2025-01-06T09:00:00.000Z', // Mon
      '2025-01-13T09:00:00.000Z',
      '2025-01-20T09:00:00.000Z',
      '2025-01-27T09:00:00.000Z',
      '2025-02-01T09:00:00.000Z', // Sat, 1st
      '2025-02-03T09:00:00.000Z', // Mon
    ]);
  });

  it('skips months that are not allowed', () => {
    expect(iso(nextRuns('0 12 * 6 *', utc('2025-01-01T00:00:00Z'), 2))).toEqual(
      ['2025-06-01T12:00:00.000Z', '2025-06-02T12:00:00.000Z'],
    );
    expect(iso(nextRuns('0 0 1 1 *', utc('2025-01-01T00:00:00Z'), 2))).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2027-01-01T00:00:00.000Z',
    ]);
  });

  it('February has no 30th: the 30th of each month skips to March', () => {
    expect(iso(nextRuns('0 0 30 * *', utc('2025-02-01T00:00:00Z'), 2))).toEqual(
      ['2025-03-30T00:00:00.000Z', '2025-04-30T00:00:00.000Z'],
    );
    expect(iso(nextRuns('0 0 31 * *', utc('2025-01-31T12:00:00Z'), 3))).toEqual(
      [
        '2025-03-31T00:00:00.000Z',
        '2025-05-31T00:00:00.000Z',
        '2025-07-31T00:00:00.000Z',
      ],
    );
  });

  it('finds Feb 29 only in leap years', () => {
    expect(iso(nextRuns('0 0 29 2 *', utc('2025-01-01T00:00:00Z'), 2))).toEqual(
      ['2028-02-29T00:00:00.000Z', '2032-02-29T00:00:00.000Z'],
    );
  });

  it('crosses a year boundary', () => {
    expect(
      iso(nextRuns('59 23 31 12 *', utc('2025-12-31T23:59:00Z'), 1)),
    ).toEqual(['2026-12-31T23:59:00.000Z']);
  });

  it('throws RangeError for a date that can never occur', () => {
    expect(() =>
      nextRuns('0 0 30 2 *', utc('2025-01-01T00:00:00Z'), 1),
    ).toThrow(RangeError);
    expect(() =>
      nextRuns('0 0 31 4,6,9,11 *', utc('2025-01-01T00:00:00Z'), 1),
    ).toThrow(RangeError);
  });

  it('every returned date satisfies matches()', () => {
    const expr = '*/20 8-10 1-7,20 * 3';
    const spec = parseCron(expr);
    const runs = nextRuns(expr, utc('2025-03-15T00:00:00Z'), 40);
    expect(runs).toHaveLength(40);
    for (let i = 0; i < runs.length; i++) {
      expect(matches(spec, runs[i])).toBe(true);
      if (i > 0)
        expect(runs[i].getTime()).toBeGreaterThan(runs[i - 1].getTime());
    }
  });
});

describe('nextRuns — performance', () => {
  it('computes 100 weekday runs in under 50ms', () => {
    const start = performance.now();
    const runs = nextRuns('0 9 * * 1-5', utc('2025-01-01T00:00:00Z'), 100);
    const elapsed = performance.now() - start;
    expect(runs).toHaveLength(100);
    expect(runs[99].toISOString()).toBe('2025-05-20T09:00:00.000Z');
    expect(elapsed).toBeLessThan(50);
  });

  it('computes 1000 five-minute runs in under 100ms', () => {
    const start = performance.now();
    const runs = nextRuns('*/5 * * * *', utc('2025-01-01T00:00:00Z'), 1000);
    const elapsed = performance.now() - start;
    expect(runs).toHaveLength(1000);
    expect(runs[999].toISOString()).toBe('2025-01-04T11:20:00.000Z');
    expect(elapsed).toBeLessThan(100);
  });

  it('a yearly schedule far in the future does not walk minute by minute', () => {
    const start = performance.now();
    const runs = nextRuns('0 0 25 12 *', utc('2025-01-01T00:00:00Z'), 5);
    const elapsed = performance.now() - start;
    expect(iso(runs)[4]).toBe('2029-12-25T00:00:00.000Z');
    expect(elapsed).toBeLessThan(50);
  });
});

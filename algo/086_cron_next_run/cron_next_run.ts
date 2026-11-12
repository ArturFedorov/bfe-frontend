/** Expanded 5-field cron expression. Every array is sorted ascending and unique. */
export interface CronSpec {
  minute: number[]; // 0-59
  hour: number[]; // 0-23
  dayOfMonth: number[]; // 1-31
  month: number[]; // 1-12
  dayOfWeek: number[]; // 0-6, 0 = Sunday
  /** true when the day-of-month field was anything other than exactly `*` */
  domRestricted: boolean;
  /** true when the day-of-week field was anything other than exactly `*` */
  dowRestricted: boolean;
}

/**
 * Parses `minute hour day-of-month month day-of-week`.
 * Supports `*`, values, lists `1,15`, ranges `1-5`, steps `*​/15` and `1-30/5`.
 * Throws SyntaxError on a bad field count, non-numeric tokens, out-of-range
 * values, reversed ranges, or a step < 1.
 */
export function parseCron(expr: string): CronSpec {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Does the UTC minute of `date` match `spec`? Seconds are ignored.
 * Day matching follows Vixie cron: when both dom and dow are restricted,
 * either may match; when only one is, only it is consulted.
 */
export function matches(spec: CronSpec, date: Date): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * The first `count` matching UTC minutes strictly after `from`, ascending.
 * Skips whole months / days / hours that cannot match. Throws RangeError if
 * no run exists within 8 years of the previous one.
 */
export function nextRuns(expr: string, from: Date, count: number): Date[] {
  // TODO: implement
  throw new Error('Not implemented');
}

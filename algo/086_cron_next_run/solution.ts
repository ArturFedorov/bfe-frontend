/**
 * 086. Cron Next Run — reference solution
 *
 * parseCron(expr)
 *   Split on whitespace into exactly five fields. Each field is a
 *   comma-separated list of tokens; each token is `base[/step]` where base is
 *   `*`, a single value `v`, or a range `a-b`. `*` expands to the field's
 *   full range, a range to [a, b], and a value to [v, v] — then we walk from
 *   the start in `step` increments (default 1). Strict validation:
 *   non-numeric pieces, out-of-range values, reversed ranges, step < 1 and
 *   `v/step` (a step on a bare value) all raise SyntaxError. The expanded
 *   values are de-duplicated and sorted. `domRestricted` / `dowRestricted`
 *   are true unless the field is literally `*`.
 *
 * matches(spec, date)
 *   Compare UTC minute/hour/month directly against the arrays. The day check
 *   follows Vixie cron: if both dom and dow are restricted, EITHER matching
 *   suffices; if only one is restricted, only it is consulted; if neither,
 *   every day matches. The restricted flags exist because `*` expands to all
 *   values, which would otherwise make the "either" test match every day.
 *
 * nextRuns(expr, from, count)
 *   Start at the minute strictly after `from` (truncate to the minute, +1).
 *   Then loop with field-by-field pruning, always resetting lower fields to
 *   zero when a higher field jumps:
 *     - month not allowed      → 1st of next month 00:00
 *     - day not allowed        → next day 00:00
 *     - no hour >= current     → next day 00:00
 *     - next hour > current    → that hour :00
 *     - no minute >= current   → next hour :00
 *     - otherwise              → emit (day, hour, minute); advance one minute
 *   `Date.UTC` normalises overflow (month 12, day 32, hour 24), so jumping
 *   needs no calendar tables and automatically handles 28/29/30/31-day
 *   months and leap years. A guard throws RangeError when the candidate
 *   drifts more than 8 years past the previous run (or `from`) — enough to
 *   always see a leap day, so Feb 30 / Apr 31 style impossibilities are
 *   detected rather than looping forever.
 *
 * Time: parse O(|expr|); nextRuns O(count × (skipped months + skipped days +
 * candidate hours + candidate minutes)) — never O(minutes elapsed).
 * Space: O(1) beyond the output.
 */

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

const MINUTE_MS = 60_000;
const MAX_GAP_YEARS = 8;

const INT_RE = /^\d+$/;

function parseInt10(token: string, field: string): number {
  if (!INT_RE.test(token)) {
    throw new SyntaxError(`Invalid number "${token}" in ${field} field`);
  }
  return Number(token);
}

/** Expands one cron field (list of `*`, `v`, `a-b`, with optional `/step`). */
function parseField(
  field: string,
  lo: number,
  hi: number,
  name: string,
): number[] {
  const values = new Set<number>();

  for (const token of field.split(',')) {
    if (token === '') throw new SyntaxError(`Empty list item in ${name} field`);

    const slash = token.split('/');
    if (slash.length > 2)
      throw new SyntaxError(`Bad step syntax "${token}" in ${name} field`);
    const [base, stepStr] = slash;

    let step = 1;
    if (stepStr !== undefined) {
      step = parseInt10(stepStr, name);
      if (step < 1) throw new SyntaxError(`Step must be >= 1 in ${name} field`);
    }

    let start: number;
    let end: number;
    if (base === '*') {
      start = lo;
      end = hi;
    } else if (base.includes('-')) {
      const [a, b, ...rest] = base.split('-');
      if (rest.length > 0)
        throw new SyntaxError(`Bad range "${base}" in ${name} field`);
      start = parseInt10(a, name);
      end = parseInt10(b, name);
      if (start > end)
        throw new SyntaxError(`Reversed range "${base}" in ${name} field`);
    } else {
      if (stepStr !== undefined) {
        throw new SyntaxError(
          `Step requires a range or * ("${token}") in ${name} field`,
        );
      }
      start = end = parseInt10(base, name);
    }

    if (start < lo || end > hi) {
      throw new SyntaxError(
        `Value out of range (${lo}-${hi}) in ${name} field: "${token}"`,
      );
    }

    for (let v = start; v <= end; v += step) values.add(v);
  }

  return [...values].sort((a, b) => a - b);
}

/**
 * Parses `minute hour day-of-month month day-of-week`.
 * Supports `*`, values, lists `1,15`, ranges `1-5`, steps `*​/15` and `1-30/5`.
 * Throws SyntaxError on a bad field count, non-numeric tokens, out-of-range
 * values, reversed ranges, or a step < 1.
 */
export function parseCron(expr: string): CronSpec {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5 || fields[0] === '') {
    throw new SyntaxError(
      `Expected 5 fields, got ${fields[0] === '' ? 0 : fields.length}`,
    );
  }
  const [min, hr, dom, mon, dow] = fields;

  return {
    minute: parseField(min, 0, 59, 'minute'),
    hour: parseField(hr, 0, 23, 'hour'),
    dayOfMonth: parseField(dom, 1, 31, 'day-of-month'),
    month: parseField(mon, 1, 12, 'month'),
    dayOfWeek: parseField(dow, 0, 6, 'day-of-week'),
    domRestricted: dom !== '*',
    dowRestricted: dow !== '*',
  };
}

/** Vixie-cron day rule over the UTC date part of `date`. */
function dayMatches(spec: CronSpec, date: Date): boolean {
  const domOk = spec.dayOfMonth.includes(date.getUTCDate());
  const dowOk = spec.dayOfWeek.includes(date.getUTCDay());

  if (spec.domRestricted && spec.dowRestricted) return domOk || dowOk;
  if (spec.domRestricted) return domOk;
  if (spec.dowRestricted) return dowOk;
  return true;
}

/**
 * Does the UTC minute of `date` match `spec`? Seconds are ignored.
 * Day matching follows Vixie cron: when both dom and dow are restricted,
 * either may match; when only one is, only it is consulted.
 */
export function matches(spec: CronSpec, date: Date): boolean {
  return (
    spec.minute.includes(date.getUTCMinutes()) &&
    spec.hour.includes(date.getUTCHours()) &&
    spec.month.includes(date.getUTCMonth() + 1) &&
    dayMatches(spec, date)
  );
}

/** Smallest element >= `value` in a sorted array, or undefined. */
const nextAtLeast = (sorted: number[], value: number): number | undefined =>
  sorted.find((v) => v >= value);

/**
 * The first `count` matching UTC minutes strictly after `from`, ascending.
 * Skips whole months / days / hours that cannot match. Throws RangeError if
 * no run exists within 8 years of the previous one.
 */
export function nextRuns(expr: string, from: Date, count: number): Date[] {
  const spec = parseCron(expr);
  const runs: Date[] = [];
  if (count <= 0) return runs;

  // Strictly after `from`: truncate to the minute, then step one minute.
  let t = Math.floor(from.getTime() / MINUTE_MS) * MINUTE_MS + MINUTE_MS;

  // Termination guard: a candidate more than 8 years past the previous run
  // (or `from`) means the schedule can never fire.
  let anchor = new Date(from.getTime());
  const deadline = (): number =>
    Date.UTC(
      anchor.getUTCFullYear() + MAX_GAP_YEARS,
      anchor.getUTCMonth(),
      anchor.getUTCDate(),
      anchor.getUTCHours(),
      anchor.getUTCMinutes(),
    );
  let limit = deadline();

  while (runs.length < count) {
    if (t > limit) {
      throw new RangeError(
        `No run for "${expr}" within ${MAX_GAP_YEARS} years`,
      );
    }

    const d = new Date(t);
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth(); // 0-based for Date.UTC
    const day = d.getUTCDate();
    const h = d.getUTCHours();
    const mi = d.getUTCMinutes();

    if (!spec.month.includes(mo + 1)) {
      t = Date.UTC(y, mo + 1, 1); // 1st of next month, 00:00
      continue;
    }

    if (!dayMatches(spec, d)) {
      t = Date.UTC(y, mo, day + 1); // next day, 00:00
      continue;
    }

    const hour = nextAtLeast(spec.hour, h);
    if (hour === undefined) {
      t = Date.UTC(y, mo, day + 1); // no hour left today
      continue;
    }
    if (hour > h) {
      t = Date.UTC(y, mo, day, hour); // later hour, minutes reset
      continue;
    }

    const minute = nextAtLeast(spec.minute, mi);
    if (minute === undefined) {
      t = Date.UTC(y, mo, day, h + 1); // no minute left this hour
      continue;
    }

    t = Date.UTC(y, mo, day, h, minute);
    const run = new Date(t);
    runs.push(run);
    anchor = run;
    limit = deadline();
    t += MINUTE_MS;
  }

  return runs;
}

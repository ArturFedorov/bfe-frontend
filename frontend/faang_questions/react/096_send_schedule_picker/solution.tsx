import { useId } from 'react';
import type { ChangeEvent, JSX } from 'react';

export type Recurrence = 'once' | 'daily' | 'weekly';

/** Local-time window in which nothing may be sent. `start`/`end` are `HH:MM` (24h). */
export type QuietHours = { start: string; end: string };

export type Schedule = {
  /** ISO-8601 instant in UTC, e.g. `2026-05-04T09:00:00.000Z`. */
  startAt: string;
  /** IANA zone name the marketer is thinking in, e.g. `Europe/London`. */
  timeZone: string;
  recurrence: Recurrence;
  quietHours: QuietHours | null;
};

/** Wall-clock parts of an instant in a zone. `month` 1–12, `weekday` 0 (Sunday) – 6 (Saturday). */
export type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

/** The zones offered by the picker, in this order. */
export const TIME_ZONES = ['UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo'] as const;

export interface SchedulePickerProps {
  value: Schedule;
  onChange: (next: Schedule) => void;
  /** The current instant — injected so tests can pin it. */
  now: Date;
}

// ---------------------------------------------------------------------------
// Zone helpers — Intl.DateTimeFormat is the only source of zone knowledge.
// ---------------------------------------------------------------------------

type WallClock = Pick<LocalParts, 'year' | 'month' | 'day' | 'hour' | 'minute'>;

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Formatter construction is expensive (ICU data load); keep one per zone. */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      // h23 is the one cycle that never prints "24" for midnight.
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Wall-clock parts of `dateUtc` in `timeZone` via Intl.DateTimeFormat (`hourCycle: 'h23'`). */
export function localParts(dateUtc: Date, timeZone: string): LocalParts {
  const parts: Record<string, string> = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(dateUtc)) {
    parts[type] = value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

/** The wall clock reinterpreted as if it were UTC — a convenient scalar for offset arithmetic. */
const wallClockAsUtc = (p: WallClock): number => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);

/** Inverse of `localParts` (seconds = 0): the instant at which that wall clock shows in `timeZone`. */
export function fromLocalParts(parts: WallClock, timeZone: string): Date {
  // `Date.UTC` normalises overflow (May 32 → June 1) for free.
  const target = wallClockAsUtc(parts);

  // Start by pretending the wall clock is UTC, then correct by however far the
  // zone's rendering of that guess is from the target. One pass is exact unless
  // the guess and the answer straddle a DST transition; a second pass fixes that.
  let utc = target;
  for (let pass = 0; pass < 2; pass += 1) {
    const seen = wallClockAsUtc(localParts(new Date(utc), timeZone));
    if (seen === target) break;
    utc += target - seen;
  }
  return new Date(utc);
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `YYYY-MM-DD HH:MM` of `dateUtc` as seen in `timeZone`. */
export function formatLocal(dateUtc: Date, timeZone: string): string {
  const p = localParts(dateUtc, timeZone);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** `HH:MM` → minutes since midnight. */
function parseClock(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** True when the local wall clock of `dateUtc` falls inside `quiet` (the window may cross midnight). */
export function isInQuietHours(dateUtc: Date, timeZone: string, quiet: QuietHours | null): boolean {
  if (!quiet) return false;
  const start = parseClock(quiet.start);
  const end = parseClock(quiet.end);
  if (start === end) return false; // empty window, not "all day"

  const p = localParts(dateUtc, timeZone);
  const m = p.hour * 60 + p.minute;
  // Same-day window: [start, end). Crossing midnight: [start, 24:00) ∪ [00:00, end).
  return start < end ? m >= start && m < end : m >= start || m < end;
}

/** Returns `dateUtc` unchanged when allowed, otherwise the first allowed instant (quiet end, same day or next). */
export function shiftOutOfQuietHours(dateUtc: Date, timeZone: string, quiet: QuietHours | null): Date {
  if (!quiet || !isInQuietHours(dateUtc, timeZone, quiet)) return dateUtc;

  const end = parseClock(quiet.end);
  const p = localParts(dateUtc, timeZone);
  const m = p.hour * 60 + p.minute;
  // Before `end` on the local day (the after-midnight tail of a crossing
  // window, or inside a same-day window) → today's `end`; otherwise tomorrow's.
  const day = m < end ? p.day : p.day + 1;
  return fromLocalParts(
    { year: p.year, month: p.month, day, hour: Math.floor(end / 60), minute: end % 60 },
    timeZone,
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The next `count` send instants on or after `nowUtc`, each shifted out of quiet hours. */
export function nextSends(schedule: Schedule, nowUtc: Date, count: number): Date[] {
  const { timeZone, quietHours } = schedule;
  const start = new Date(schedule.startAt);
  const shift = (d: Date) => shiftOutOfQuietHours(d, timeZone, quietHours);

  if (schedule.recurrence === 'once') {
    return start.getTime() >= nowUtc.getTime() ? [shift(start)] : [];
  }

  const step = schedule.recurrence === 'daily' ? 1 : 7;
  // Step the *local* wall clock by whole days and let the zone resolve each
  // one: 09:00 stays 09:00 across a DST change, which `+ 24h` would not.
  const anchor = localParts(start, timeZone);

  // Skip straight to the neighbourhood of `now` instead of scanning from the
  // anchor; the loop below still does the exact `>= now` check. The -1 guards
  // against the estimate landing one step too late (DST makes days ≠ 24h).
  const elapsedSteps = Math.floor((nowUtc.getTime() - start.getTime()) / (step * DAY_MS));
  let k = Math.max(0, elapsedSteps - 1);

  const sends: Date[] = [];
  while (sends.length < count) {
    const occurrence = fromLocalParts({ ...anchor, day: anchor.day + k * step }, timeZone);
    k += 1;
    // The `now` comparison uses the unshifted occurrence by spec.
    if (occurrence.getTime() < nowUtc.getTime()) continue;
    sends.push(shift(occurrence));
  }
  return sends;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DEFAULT_QUIET: QuietHours = { start: '22:00', end: '08:00' };
const RECURRENCES: Array<{ value: Recurrence; label: string }> = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];
const PREVIEW_COUNT = 5;

/**
 * Fully controlled: `value` is the only state and it lives in the parent.
 * `startAt` is an instant; the zone is how the marketer *sees* it, so every
 * input shows `startAt` through `localParts(…, value.timeZone)` and every edit
 * goes back through `fromLocalParts`.
 */
export function SchedulePicker({ value, onChange, now }: SchedulePickerProps): JSX.Element {
  const id = useId();
  const start = new Date(value.startAt);
  const local = localParts(start, value.timeZone);
  const sends = nextSends(value, now, PREVIEW_COUNT);
  const isPast = start.getTime() < now.getTime();

  const update = (patch: Partial<Schedule>) => onChange({ ...value, ...patch });
  const setWallClock = (wall: WallClock, timeZone = value.timeZone) =>
    update({ timeZone, startAt: fromLocalParts(wall, timeZone).toISOString() });

  const onDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Native date inputs emit '' while the user is mid-edit / after clearing.
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    setWallClock({ year, month, day, hour: local.hour, minute: local.minute });
  };

  const onTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [hour, minute] = e.target.value.split(':').map(Number);
    setWallClock({ year: local.year, month: local.month, day: local.day, hour, minute });
  };

  // Changing the zone keeps the *wall clock*: "09:00" stays "09:00", the instant moves.
  const onZoneChange = (e: ChangeEvent<HTMLSelectElement>) => setWallClock(local, e.target.value);

  const onQuietToggle = (e: ChangeEvent<HTMLInputElement>) =>
    update({ quietHours: e.target.checked ? DEFAULT_QUIET : null });

  const onQuietEdit = (key: keyof QuietHours) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!value.quietHours || !e.target.value) return;
    update({ quietHours: { ...value.quietHours, [key]: e.target.value } });
  };

  const dateValue = `${local.year}-${pad2(local.month)}-${pad2(local.day)}`;
  const timeValue = `${pad2(local.hour)}:${pad2(local.minute)}`;

  return (
    <div className="schedule-picker">
      <div>
        <label htmlFor={`${id}-date`}>Date</label>
        <input id={`${id}-date`} type="date" value={dateValue} onChange={onDateChange} />
      </div>
      <div>
        <label htmlFor={`${id}-time`}>Time</label>
        <input id={`${id}-time`} type="time" value={timeValue} onChange={onTimeChange} />
      </div>
      <div>
        <label htmlFor={`${id}-zone`}>Time zone</label>
        <select id={`${id}-zone`} value={value.timeZone} onChange={onZoneChange}>
          {TIME_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      <fieldset role="radiogroup" aria-label="Recurrence">
        <legend>Recurrence</legend>
        {RECURRENCES.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={`${id}-recurrence`}
              value={option.value}
              checked={value.recurrence === option.value}
              onChange={() => update({ recurrence: option.value })}
            />{' '}
            {option.label}
          </label>
        ))}
      </fieldset>

      <div>
        <label>
          <input type="checkbox" checked={value.quietHours !== null} onChange={onQuietToggle} /> Respect quiet hours
        </label>
        {value.quietHours && (
          <div>
            <label htmlFor={`${id}-quiet-from`}>Quiet from</label>
            <input
              id={`${id}-quiet-from`}
              type="time"
              value={value.quietHours.start}
              onChange={onQuietEdit('start')}
            />
            <label htmlFor={`${id}-quiet-until`}>Quiet until</label>
            <input
              id={`${id}-quiet-until`}
              type="time"
              value={value.quietHours.end}
              onChange={onQuietEdit('end')}
            />
          </div>
        )}
      </div>

      {isPast && <p role="alert">Start time is in the past</p>}

      {/* The list is always present (even empty) so assistive tech has a stable landmark to return to. */}
      <ul role="list" aria-label="Next sends">
        {sends.map((d) => (
          <li key={d.toISOString()}>{formatLocal(d, value.timeZone)}</li>
        ))}
      </ul>
      {sends.length === 0 && <p>No upcoming sends</p>}
    </div>
  );
}

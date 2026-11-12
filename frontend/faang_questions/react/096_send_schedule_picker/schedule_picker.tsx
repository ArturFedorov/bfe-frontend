import type { JSX } from 'react';

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

/** Wall-clock parts of `dateUtc` in `timeZone` via Intl.DateTimeFormat (`hourCycle: 'h23'`). */
export function localParts(dateUtc: Date, timeZone: string): LocalParts {
  throw new Error('Not implemented');
}

/** Inverse of `localParts` (seconds = 0): the instant at which that wall clock shows in `timeZone`. */
export function fromLocalParts(
  parts: Pick<LocalParts, 'year' | 'month' | 'day' | 'hour' | 'minute'>,
  timeZone: string,
): Date {
  throw new Error('Not implemented');
}

/** `YYYY-MM-DD HH:MM` of `dateUtc` as seen in `timeZone`. */
export function formatLocal(dateUtc: Date, timeZone: string): string {
  throw new Error('Not implemented');
}

/** True when the local wall clock of `dateUtc` falls inside `quiet` (the window may cross midnight). */
export function isInQuietHours(dateUtc: Date, timeZone: string, quiet: QuietHours | null): boolean {
  throw new Error('Not implemented');
}

/** Returns `dateUtc` unchanged when allowed, otherwise the first allowed instant (quiet end, same day or next). */
export function shiftOutOfQuietHours(dateUtc: Date, timeZone: string, quiet: QuietHours | null): Date {
  throw new Error('Not implemented');
}

/** The next `count` send instants on or after `nowUtc`, each shifted out of quiet hours. */
export function nextSends(schedule: Schedule, nowUtc: Date, count: number): Date[] {
  throw new Error('Not implemented');
}

export function SchedulePicker(props: SchedulePickerProps): JSX.Element {
  throw new Error('Not implemented');
}

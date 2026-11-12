/**
 * Milestone 6b — schedule form with a "next sends" preview.
 * See README.md in this folder. Tests: SchedulePicker.test.tsx.
 */
import type { ReactNode } from 'react';
import type { Schedule } from './schedule';

export const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Kolkata',
  'Asia/Tokyo',
] as const;

export interface SchedulePickerProps {
  value: Schedule;
  onChange: (next: Schedule) => void;
  /** Clock for the preview. Default `() => new Date()`. */
  now?: () => Date;
  /** How many upcoming sends to preview. Default 5. */
  previewCount?: number;
}

export function SchedulePicker({
  value,
  onChange,
  now,
  previewCount = 5,
}: SchedulePickerProps): ReactNode {
  void value;
  void onChange;
  void now;
  void previewCount;
  throw new Error('Not implemented');
}

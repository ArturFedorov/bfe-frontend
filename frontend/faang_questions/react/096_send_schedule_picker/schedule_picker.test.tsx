/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  formatLocal,
  fromLocalParts,
  isInQuietHours,
  localParts,
  nextSends,
  Schedule,
  SchedulePicker,
  shiftOutOfQuietHours,
  TIME_ZONES,
} from './schedule_picker';

const NOW = new Date('2026-05-01T00:00:00Z');

const base: Schedule = {
  startAt: '2026-05-04T09:00:00.000Z',
  timeZone: 'UTC',
  recurrence: 'daily',
  quietHours: null,
};

const iso = (dates: Date[]) => dates.map((d) => d.toISOString());

function rows(): string[] {
  return within(screen.getByRole('list', { name: 'Next sends' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent ?? '');
}

function setup(value: Schedule = base, now: Date = NOW) {
  const onChange = jest.fn();
  render(<SchedulePicker value={value} onChange={onChange} now={now} />);
  return { onChange };
}

/** Parent that applies every change, for chained interactions. */
function Controlled({ initial, now, spy }: { initial: Schedule; now: Date; spy: jest.Mock }) {
  const [value, setValue] = useState(initial);
  return (
    <SchedulePicker
      value={value}
      now={now}
      onChange={(next) => {
        spy(next);
        setValue(next);
      }}
    />
  );
}

describe('096 schedule picker — localParts / fromLocalParts / formatLocal', () => {
  it('localParts reads the wall clock in the zone with hourCycle h23 and weekday 0 = Sunday', () => {
    expect(localParts(new Date('2026-05-10T14:00:00Z'), 'Asia/Tokyo')).toEqual({
      year: 2026,
      month: 5,
      day: 10,
      hour: 23,
      minute: 0,
      weekday: 0,
    });
    expect(localParts(new Date('2026-05-10T15:00:00Z'), 'Asia/Tokyo')).toMatchObject({ day: 11, hour: 0 });
  });

  it('fromLocalParts resolves a BST wall clock to the right instant and round-trips', () => {
    expect(fromLocalParts({ year: 2026, month: 3, day: 29, hour: 9, minute: 0 }, 'Europe/London').toISOString()).toBe(
      '2026-03-29T08:00:00.000Z',
    );
    expect(fromLocalParts({ year: 2026, month: 1, day: 15, hour: 9, minute: 30 }, 'Europe/London').toISOString()).toBe(
      '2026-01-15T09:30:00.000Z',
    );
    const instant = new Date('2026-10-26T13:00:00Z');
    expect(fromLocalParts(localParts(instant, 'America/New_York'), 'America/New_York').getTime()).toBe(
      instant.getTime(),
    );
  });

  it('fromLocalParts normalises day overflow', () => {
    expect(fromLocalParts({ year: 2026, month: 5, day: 32, hour: 0, minute: 0 }, 'UTC').toISOString()).toBe(
      '2026-06-01T00:00:00.000Z',
    );
  });

  it('formatLocal returns zero-padded YYYY-MM-DD HH:MM in the zone', () => {
    expect(formatLocal(new Date('2026-03-29T08:00:00Z'), 'Europe/London')).toBe('2026-03-29 09:00');
    expect(formatLocal(new Date('2026-05-04T00:05:00Z'), 'Asia/Tokyo')).toBe('2026-05-04 09:05');
  });
});

describe('096 schedule picker — quiet hours', () => {
  const window = { start: '12:00', end: '13:00' };
  const night = { start: '22:00', end: '07:00' };

  it('isInQuietHours is inclusive at start and exclusive at end, and false for null', () => {
    expect(isInQuietHours(new Date('2026-05-01T12:00:00Z'), 'UTC', window)).toBe(true);
    expect(isInQuietHours(new Date('2026-05-01T12:30:00Z'), 'UTC', window)).toBe(true);
    expect(isInQuietHours(new Date('2026-05-01T13:00:00Z'), 'UTC', window)).toBe(false);
    expect(isInQuietHours(new Date('2026-05-01T12:30:00Z'), 'UTC', null)).toBe(false);
    expect(isInQuietHours(new Date('2026-05-01T12:30:00Z'), 'UTC', { start: '12:30', end: '12:30' })).toBe(false);
  });

  it('isInQuietHours handles a window that crosses midnight in the given zone', () => {
    expect(isInQuietHours(new Date('2026-05-10T14:00:00Z'), 'Asia/Tokyo', night)).toBe(true); // 23:00 JST
    expect(isInQuietHours(new Date('2026-05-10T20:00:00Z'), 'Asia/Tokyo', night)).toBe(true); // 05:00 JST
    expect(isInQuietHours(new Date('2026-05-10T03:00:00Z'), 'Asia/Tokyo', night)).toBe(false); // 12:00 JST
  });

  it('shiftOutOfQuietHours returns the same instant when allowed', () => {
    const d = new Date('2026-05-10T03:00:00Z');
    expect(shiftOutOfQuietHours(d, 'Asia/Tokyo', night).getTime()).toBe(d.getTime());
    expect(shiftOutOfQuietHours(d, 'Asia/Tokyo', null).getTime()).toBe(d.getTime());
  });

  it('shiftOutOfQuietHours moves to the quiet end on the same day or the next day', () => {
    // 12:30Z inside 12:00–13:00 → 13:00Z the same day
    expect(shiftOutOfQuietHours(new Date('2026-05-01T12:30:00Z'), 'UTC', window).toISOString()).toBe(
      '2026-05-01T13:00:00.000Z',
    );
    // 23:00 JST May 10 → 07:00 JST May 11 (= 22:00Z May 10)
    expect(shiftOutOfQuietHours(new Date('2026-05-10T14:00:00Z'), 'Asia/Tokyo', night).toISOString()).toBe(
      '2026-05-10T22:00:00.000Z',
    );
    // 05:00 JST May 11 → 07:00 JST May 11
    expect(shiftOutOfQuietHours(new Date('2026-05-10T20:00:00Z'), 'Asia/Tokyo', night).toISOString()).toBe(
      '2026-05-10T22:00:00.000Z',
    );
  });
});

describe('096 schedule picker — nextSends', () => {
  it('once: the start itself when in the future, nothing when in the past', () => {
    expect(iso(nextSends({ ...base, recurrence: 'once' }, NOW, 5))).toEqual(['2026-05-04T09:00:00.000Z']);
    expect(nextSends({ ...base, recurrence: 'once', startAt: '2026-04-28T09:00:00.000Z' }, NOW, 5)).toEqual([]);
  });

  it('daily: starts from the first occurrence on or after now when startAt is in the past', () => {
    expect(iso(nextSends({ ...base, startAt: '2026-04-28T09:00:00.000Z' }, NOW, 3))).toEqual([
      '2026-05-01T09:00:00.000Z',
      '2026-05-02T09:00:00.000Z',
      '2026-05-03T09:00:00.000Z',
    ]);
  });

  it('shifts every occurrence out of quiet hours (window crossing midnight)', () => {
    const s: Schedule = {
      startAt: '2026-05-10T14:00:00.000Z', // 23:00 JST
      timeZone: 'Asia/Tokyo',
      recurrence: 'daily',
      quietHours: { start: '22:00', end: '07:00' },
    };
    expect(iso(nextSends(s, new Date('2026-05-10T00:00:00Z'), 2))).toEqual([
      '2026-05-10T22:00:00.000Z',
      '2026-05-11T22:00:00.000Z',
    ]);
  });

  it('senior: daily 09:00 Europe/London keeps the local hour across the spring-forward change', () => {
    const s: Schedule = {
      startAt: '2026-03-27T09:00:00.000Z',
      timeZone: 'Europe/London',
      recurrence: 'daily',
      quietHours: null,
    };
    const sends = nextSends(s, new Date('2026-03-27T00:00:00Z'), 4);
    expect(iso(sends)).toEqual([
      '2026-03-27T09:00:00.000Z',
      '2026-03-28T09:00:00.000Z',
      '2026-03-29T08:00:00.000Z',
      '2026-03-30T08:00:00.000Z',
    ]);
    expect(sends.map((d) => localParts(d, 'Europe/London').hour)).toEqual([9, 9, 9, 9]);
  });

  it('senior: weekly 09:00 America/New_York keeps the local hour across the fall-back change', () => {
    const s: Schedule = {
      startAt: '2026-10-26T13:00:00.000Z',
      timeZone: 'America/New_York',
      recurrence: 'weekly',
      quietHours: null,
    };
    expect(iso(nextSends(s, new Date('2026-10-26T00:00:00Z'), 2))).toEqual([
      '2026-10-26T13:00:00.000Z',
      '2026-11-02T14:00:00.000Z',
    ]);
  });
});

describe('096 schedule picker — renders from value', () => {
  it('shows date, time, zone, recurrence, quiet state and five next sends', () => {
    setup();
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-04');
    expect(screen.getByLabelText('Time')).toHaveValue('09:00');
    expect(screen.getByLabelText('Time zone')).toHaveValue('UTC');
    expect(
      within(screen.getByLabelText('Time zone'))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([...TIME_ZONES]);
    expect(within(screen.getByRole('radiogroup', { name: 'Recurrence' })).getByRole('radio', { name: 'Daily' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Respect quiet hours' })).not.toBeChecked();
    expect(screen.queryByLabelText('Quiet from')).not.toBeInTheDocument();
    expect(rows()).toEqual([
      '2026-05-04 09:00',
      '2026-05-05 09:00',
      '2026-05-06 09:00',
      '2026-05-07 09:00',
      '2026-05-08 09:00',
    ]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the date and time in the selected zone, not in UTC', () => {
    setup({ ...base, timeZone: 'Asia/Tokyo' }); // 09:00Z = 18:00 JST
    expect(screen.getByLabelText('Date')).toHaveValue('2026-05-04');
    expect(screen.getByLabelText('Time')).toHaveValue('18:00');
    expect(rows()[0]).toBe('2026-05-04 18:00');
  });

  it('quiet hours shift the rendered rows', () => {
    setup({ ...base, quietHours: { start: '08:00', end: '10:00' } });
    expect(screen.getByRole('checkbox', { name: 'Respect quiet hours' })).toBeChecked();
    expect(screen.getByLabelText('Quiet from')).toHaveValue('08:00');
    expect(screen.getByLabelText('Quiet until')).toHaveValue('10:00');
    expect(rows()[0]).toBe('2026-05-04 10:00');
  });

  it('senior: a London daily schedule shows 09:00 on every row across the DST change', () => {
    setup(
      { startAt: '2026-03-27T09:00:00.000Z', timeZone: 'Europe/London', recurrence: 'daily', quietHours: null },
      new Date('2026-03-27T00:00:00Z'),
    );
    const list = rows();
    expect(list).toHaveLength(5);
    expect(list.every((r) => r.endsWith(' 09:00'))).toBe(true);
    expect(list).toContain('2026-03-29 09:00');
    expect(list).toContain('2026-03-30 09:00');
  });
});

describe('096 schedule picker — edits call onChange with the next Schedule', () => {
  it('changing the time keeps the local date and zone', () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:30' } });
    expect(onChange).toHaveBeenCalledWith({ ...base, startAt: '2026-05-04T10:30:00.000Z' });
  });

  it('changing the date keeps the local time', () => {
    const { onChange } = setup({ ...base, timeZone: 'Asia/Tokyo' }); // 18:00 JST
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-05-06' } });
    expect(onChange).toHaveBeenCalledWith({ ...base, timeZone: 'Asia/Tokyo', startAt: '2026-05-06T09:00:00.000Z' });
  });

  it('changing the zone keeps the wall clock (09:00 UTC → 09:00 Tokyo)', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await user.selectOptions(screen.getByLabelText('Time zone'), 'Asia/Tokyo');
    expect(onChange).toHaveBeenCalledWith({ ...base, timeZone: 'Asia/Tokyo', startAt: '2026-05-04T00:00:00.000Z' });
  });

  it('choosing a recurrence radio changes only recurrence', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await user.click(screen.getByRole('radio', { name: 'Weekly' }));
    expect(onChange).toHaveBeenCalledWith({ ...base, recurrence: 'weekly' });
  });

  it('checking quiet hours sets the default window, editing updates it, unchecking clears it', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Controlled initial={base} now={NOW} spy={spy} />);

    await user.click(screen.getByRole('checkbox', { name: 'Respect quiet hours' }));
    expect(spy).toHaveBeenLastCalledWith({ ...base, quietHours: { start: '22:00', end: '08:00' } });

    fireEvent.change(screen.getByLabelText('Quiet from'), { target: { value: '21:00' } });
    expect(spy).toHaveBeenLastCalledWith({ ...base, quietHours: { start: '21:00', end: '08:00' } });

    fireEvent.change(screen.getByLabelText('Quiet until'), { target: { value: '07:30' } });
    expect(spy).toHaveBeenLastCalledWith({ ...base, quietHours: { start: '21:00', end: '07:30' } });

    await user.click(screen.getByRole('checkbox', { name: 'Respect quiet hours' }));
    expect(spy).toHaveBeenLastCalledWith({ ...base, quietHours: null });
    expect(screen.queryByLabelText('Quiet from')).not.toBeInTheDocument();
  });

  it('is fully controlled: a parent that ignores onChange leaves the inputs unchanged', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:30' } });
    expect(screen.getByLabelText('Time')).toHaveValue('09:00');
    expect(rows()[0]).toBe('2026-05-04 09:00');
  });

  it('weekly rows step by seven days when the parent applies the change', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={base} now={NOW} spy={jest.fn()} />);
    await user.click(screen.getByRole('radio', { name: 'Weekly' }));
    expect(rows()).toEqual([
      '2026-05-04 09:00',
      '2026-05-11 09:00',
      '2026-05-18 09:00',
      '2026-05-25 09:00',
      '2026-06-01 09:00',
    ]);
  });
});

describe('096 schedule picker — past start', () => {
  it('warns and starts the list from the next occurrence', () => {
    setup({ ...base, startAt: '2026-04-28T09:00:00.000Z' });
    expect(screen.getByRole('alert')).toHaveTextContent('Start time is in the past');
    expect(rows()[0]).toBe('2026-05-01 09:00');
  });

  it('once in the past: warns and shows No upcoming sends', () => {
    setup({ ...base, recurrence: 'once', startAt: '2026-04-28T09:00:00.000Z' });
    expect(screen.getByRole('alert')).toHaveTextContent('Start time is in the past');
    expect(rows()).toEqual([]);
    expect(screen.getByText('No upcoming sends')).toBeInTheDocument();
  });
});

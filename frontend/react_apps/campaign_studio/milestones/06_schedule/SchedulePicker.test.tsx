/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { type Schedule } from './schedule';
import { SchedulePicker } from './SchedulePicker';

const INITIAL: Schedule = {
  timezone: 'America/New_York',
  startDate: '2026-10-26',
  time: '09:30',
  recurrence: 'weekly',
  weekdays: [1, 3, 5],
  quietHours: [{ days: [], start: '21:00', end: '08:00' }],
};

const NOW = () => new Date('2026-10-28T01:00:00Z');

/** Controlled harness: holds the Schedule like App does and records every onChange. */
function Harness({
  initial = INITIAL,
  onChange,
  previewCount,
}: {
  initial?: Schedule;
  onChange: jest.Mock;
  previewCount?: number;
}) {
  const [value, setValue] = useState(initial);
  return (
    <SchedulePicker
      value={value}
      now={NOW}
      previewCount={previewCount}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

describe('SchedulePicker', () => {
  it('renders controlled fields from value and previews the next sends in the schedule timezone', () => {
    render(<Harness onChange={jest.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toHaveValue(
      'America/New_York',
    );
    expect(screen.getByRole('combobox', { name: 'Recurrence' })).toHaveValue(
      'weekly',
    );
    expect(screen.getByLabelText('Send time')).toHaveValue('09:30');
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-10-26');

    const list = screen.getByRole('list', { name: 'Next sends' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    // Wed Oct 28, Fri Oct 30, Mon Nov 2, Wed Nov 4, Fri Nov 6 — all 09:30 local
    expect(items[0]).toHaveTextContent(/Wed.*Oct 28, 2026.*09:30/);
    expect(items[2]).toHaveTextContent(/Mon.*Nov 2, 2026.*09:30/);
    expect(items[4]).toHaveTextContent(/Fri.*Nov 6, 2026.*09:30/);
  });

  it('weekday checkboxes only exist for weekly recurrence and toggle onChange(weekdays)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} previewCount={2} />);

    expect(screen.getByRole('checkbox', { name: 'Monday' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Tuesday' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Sunday' })).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Thursday' }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...INITIAL,
      weekdays: [1, 3, 4, 5],
    });
    expect(screen.getByRole('checkbox', { name: 'Thursday' })).toBeChecked();

    // the preview follows the new value: Thursday Oct 29 is now the second send
    const list = screen.getByRole('list', { name: 'Next sends' });
    expect(within(list).getAllByRole('listitem')[1]).toHaveTextContent(
      /Thu.*Oct 29, 2026.*09:30/,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Recurrence' }),
      'daily',
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ recurrence: 'daily' }),
    );
    expect(
      screen.queryByRole('checkbox', { name: 'Monday' }),
    ).not.toBeInTheDocument();
  });

  it('changing the timezone or send time reports a new Schedule and re-renders the preview', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} previewCount={1} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Timezone' }),
      'Asia/Tokyo',
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...INITIAL,
      timezone: 'Asia/Tokyo',
    });
    // Wed Oct 28 09:30 Tokyo is 00:30Z, already before `now` (01:00Z) → first send is Fri Oct 30 09:30 Tokyo
    const list = screen.getByRole('list', { name: 'Next sends' });
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent(
      /Fri.*Oct 30, 2026.*09:30/,
    );

    const time = screen.getByLabelText('Send time');
    await user.clear(time);
    await user.type(time, '18:45');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ time: '18:45' }),
    );
    expect(
      within(screen.getByRole('list', { name: 'Next sends' })).getAllByRole(
        'listitem',
      )[0],
    ).toHaveTextContent(/18:45/);
  });

  it('quiet-hour rows can be added and removed; a full-week quiet window shows an alert instead of a list', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} previewCount={1} />);

    expect(screen.getAllByLabelText('Quiet start')).toHaveLength(1);
    expect(screen.getByLabelText('Quiet start')).toHaveValue('21:00');
    expect(screen.getByLabelText('Quiet end')).toHaveValue('08:00');

    await user.click(screen.getByRole('button', { name: 'Add quiet hours' }));
    expect(screen.getAllByLabelText('Quiet start')).toHaveLength(2);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        quietHours: [
          INITIAL.quietHours[0],
          expect.objectContaining({ days: [] }),
        ],
      }),
    );

    // Make the first window cover the whole day (end === start wraps 24h) → every day is quiet
    const firstEnd = screen.getAllByLabelText('Quiet end')[0];
    await user.clear(firstEnd);
    await user.type(firstEnd, '21:00');
    expect(screen.getByRole('alert')).toHaveTextContent(/whole week/i);
    expect(
      screen.queryByRole('list', { name: 'Next sends' }),
    ).not.toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(screen.queryByLabelText('Quiet start')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ quietHours: [] }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // without quiet hours the Wed 09:30 send is back
    expect(
      within(screen.getByRole('list', { name: 'Next sends' })).getAllByRole(
        'listitem',
      )[0],
    ).toHaveTextContent(/Wed.*Oct 28, 2026.*09:30/);
  });
});

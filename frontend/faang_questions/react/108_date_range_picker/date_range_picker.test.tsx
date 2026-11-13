/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  addMonths,
  DateRange,
  DateRangePicker,
  DateRangePickerProps,
  daysInMonth,
  isBetween,
  monthGrid,
} from './date_range_picker';

const TODAY = '2026-03-10';
const EMPTY: DateRange = { start: null, end: null };
const MARCH: DateRange = { start: '2026-03-15', end: '2026-03-18' };

type Props = Partial<DateRangePickerProps>;

function setup(props: Props = {}) {
  const onChange = jest.fn();
  render(<DateRangePicker value={EMPTY} onChange={onChange} today={TODAY} {...props} />);
  return { onChange };
}

/** Parent that applies every change, for chained interactions. */
function Controlled({ initial, spy, ...rest }: { initial: DateRange; spy: jest.Mock } & Props) {
  const [value, setValue] = useState(initial);
  return (
    <DateRangePicker
      value={value}
      today={TODAY}
      {...rest}
      onChange={(next) => {
        spy(next);
        setValue(next);
      }}
    />
  );
}

/** A day cell by its accessible name, e.g. `15 March 2026`. */
const cell = (name: string) => screen.getByRole('gridcell', { name });
const dayCells = () => screen.getAllByRole('gridcell', { name: /\d{4}$/ });
const heading = () => screen.getByRole('heading');
const tabbableCells = () => dayCells().filter((c) => c.getAttribute('tabindex') === '0');
const focusedName = () => document.activeElement?.getAttribute('aria-label');

describe('108 date range picker — pure helpers', () => {
  it('daysInMonth follows Gregorian leap rules', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('monthGrid is 6×7 with leading/trailing nulls, column 0 = weekStartsOn', () => {
    // 1 March 2026 is a Sunday.
    const mon = monthGrid(2026, 3, 1);
    expect(mon).toHaveLength(6);
    expect(mon.every((row) => row.length === 7)).toBe(true);
    expect(mon[0]).toEqual([null, null, null, null, null, null, '2026-03-01']);
    expect(mon[1][0]).toBe('2026-03-02');
    expect(mon[5]).toEqual(['2026-03-30', '2026-03-31', null, null, null, null, null]);
    expect(mon.flat().filter(Boolean)).toHaveLength(31);

    const sun = monthGrid(2026, 3, 0);
    expect(sun[0][0]).toBe('2026-03-01');
    expect(sun[4][2]).toBe('2026-03-31');
    expect(sun[5].every((d) => d === null)).toBe(true);
  });

  it('isBetween is exclusive of both bounds, order-insensitive, false with a null bound', () => {
    expect(isBetween('2026-03-16', '2026-03-15', '2026-03-18')).toBe(true);
    expect(isBetween('2026-03-15', '2026-03-15', '2026-03-18')).toBe(false);
    expect(isBetween('2026-03-18', '2026-03-15', '2026-03-18')).toBe(false);
    expect(isBetween('2026-03-16', '2026-03-18', '2026-03-15')).toBe(true);
    expect(isBetween('2026-03-16', '2026-03-15', null)).toBe(false);
    expect(isBetween('2026-03-16', null, null)).toBe(false);
  });

  it('addMonths crosses year boundaries in both directions', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-03', 14)).toBe('2027-05');
    expect(addMonths('2026-03', -27)).toBe('2023-12');
    expect(addMonths('2026-03', 0)).toBe('2026-03');
  });
});

describe('108 date range picker — calendar rendering', () => {
  it('shows the month heading, a grid named after it, weekday headers and one cell per day', () => {
    setup({ initialMonth: '2026-03' });
    expect(heading()).toHaveTextContent('March 2026');
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
    expect(dayCells()).toHaveLength(31);
    expect(cell('1 March 2026')).toHaveTextContent('1');
    expect(cell('31 March 2026')).toBeInTheDocument();
  });

  it('weekStartsOn 0 puts Sunday first', () => {
    setup({ initialMonth: '2026-03', weekStartsOn: 0 });
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
  });

  it('Previous / Next month buttons move the visible month', async () => {
    const user = userEvent.setup();
    setup({ initialMonth: '2026-03' });
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(heading()).toHaveTextContent('April 2026');
    expect(dayCells()).toHaveLength(30);
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(heading()).toHaveTextContent('February 2026');
    expect(dayCells()).toHaveLength(28);
  });

  it("defaults the month to the start's month, else to today's month", () => {
    const { unmount } = render(
      <DateRangePicker value={{ start: '2026-05-20', end: null }} onChange={jest.fn()} today={TODAY} />,
    );
    expect(heading()).toHaveTextContent('May 2026');
    unmount();
    setup();
    expect(heading()).toHaveTextContent('March 2026');
  });
});

describe('108 date range picker — selection from value', () => {
  it('marks start and end aria-selected and the days between data-in-range', () => {
    setup({ value: MARCH });
    expect(cell('15 March 2026')).toHaveAttribute('aria-selected', 'true');
    expect(cell('18 March 2026')).toHaveAttribute('aria-selected', 'true');
    expect(cell('16 March 2026')).toHaveAttribute('aria-selected', 'false');
    expect(cell('16 March 2026')).toHaveAttribute('data-in-range');
    expect(cell('17 March 2026')).toHaveAttribute('data-in-range');
    expect(cell('15 March 2026')).not.toHaveAttribute('data-in-range');
    expect(cell('18 March 2026')).not.toHaveAttribute('data-in-range');
    expect(cell('19 March 2026')).not.toHaveAttribute('data-in-range');
  });

  it('is controlled: a parent that ignores onChange shows no selection', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ initialMonth: '2026-03' });
    await user.click(cell('15 March 2026'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(cell('15 March 2026')).toHaveAttribute('aria-selected', 'false');
  });
});

describe('108 date range picker — click flow', () => {
  it('first click sets start, second sets end, third starts over', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Controlled initial={EMPTY} spy={spy} initialMonth="2026-03" />);

    await user.click(cell('15 March 2026'));
    expect(spy).toHaveBeenLastCalledWith({ start: '2026-03-15', end: null });

    await user.click(cell('18 March 2026'));
    expect(spy).toHaveBeenLastCalledWith({ start: '2026-03-15', end: '2026-03-18' });

    await user.click(cell('20 March 2026'));
    expect(spy).toHaveBeenLastCalledWith({ start: '2026-03-20', end: null });
    expect(cell('15 March 2026')).toHaveAttribute('aria-selected', 'false');
    expect(cell('18 March 2026')).toHaveAttribute('aria-selected', 'false');
  });

  it('a second click on the start day makes a single-day range', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: { start: '2026-03-15', end: null } });
    await user.click(cell('15 March 2026'));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-03-15', end: '2026-03-15' });
  });

  it('senior: an end clicked before the start swaps the two', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: { start: '2026-03-15', end: null } });
    await user.click(cell('11 March 2026'));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-03-11', end: '2026-03-15' });
  });
});

describe('108 date range picker — hover preview', () => {
  it('previews the range from start to the hovered day without calling onChange', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ value: { start: '2026-03-15', end: null } });
    await user.hover(cell('18 March 2026'));
    expect(cell('16 March 2026')).toHaveAttribute('data-preview');
    expect(cell('17 March 2026')).toHaveAttribute('data-preview');
    expect(cell('18 March 2026')).toHaveAttribute('data-preview');
    expect(cell('15 March 2026')).not.toHaveAttribute('data-preview');
    expect(cell('19 March 2026')).not.toHaveAttribute('data-preview');
    expect(onChange).not.toHaveBeenCalled();

    await user.unhover(cell('18 March 2026'));
    expect(screen.getByRole('grid').querySelectorAll('[data-preview]')).toHaveLength(0);
  });

  it('previews backwards when hovering before the start and never previews once end is set', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <DateRangePicker value={{ start: '2026-03-15', end: null }} onChange={jest.fn()} today={TODAY} />,
    );
    await user.hover(cell('12 March 2026'));
    expect(cell('12 March 2026')).toHaveAttribute('data-preview');
    expect(cell('14 March 2026')).toHaveAttribute('data-preview');
    expect(cell('16 March 2026')).not.toHaveAttribute('data-preview');
    unmount();

    setup({ value: MARCH });
    await user.hover(cell('25 March 2026'));
    expect(screen.getByRole('grid').querySelectorAll('[data-preview]')).toHaveLength(0);
  });
});

describe('108 date range picker — min / max', () => {
  it('disables days outside the bounds and ignores clicks and Enter on them', async () => {
    const user = userEvent.setup();
    const { onChange } = setup({ initialMonth: '2026-03', min: '2026-03-10', max: '2026-03-20' });
    expect(cell('9 March 2026')).toHaveAttribute('aria-disabled', 'true');
    expect(cell('21 March 2026')).toHaveAttribute('aria-disabled', 'true');
    expect(cell('10 March 2026')).not.toHaveAttribute('aria-disabled');
    expect(cell('20 March 2026')).not.toHaveAttribute('aria-disabled');

    await user.click(cell('9 March 2026'));
    cell('21 March 2026').focus();
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();

    await user.click(cell('10 March 2026'));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-03-10', end: null });
  });
});

describe('108 date range picker — keyboard', () => {
  it('exactly one cell is tabbable: the start when present, otherwise today', () => {
    const { unmount } = render(<DateRangePicker value={MARCH} onChange={jest.fn()} today={TODAY} />);
    expect(tabbableCells().map((c) => c.getAttribute('aria-label'))).toEqual(['15 March 2026']);
    unmount();
    setup();
    expect(tabbableCells().map((c) => c.getAttribute('aria-label'))).toEqual(['10 March 2026']);
  });

  it('Tab reaches the grid after the two month buttons', async () => {
    const user = userEvent.setup();
    setup({ value: MARCH });
    await user.tab();
    await user.tab();
    await user.tab();
    expect(focusedName()).toBe('15 March 2026');
  });

  it('Arrow keys move by day and by week; Home/End go to the week bounds', async () => {
    const user = userEvent.setup();
    setup({ value: { start: '2026-03-11', end: null } }); // a Wednesday
    cell('11 March 2026').focus();
    await user.keyboard('{ArrowRight}');
    expect(focusedName()).toBe('12 March 2026');
    await user.keyboard('{ArrowDown}');
    expect(focusedName()).toBe('19 March 2026');
    await user.keyboard('{ArrowLeft}');
    expect(focusedName()).toBe('18 March 2026');
    await user.keyboard('{ArrowUp}');
    expect(focusedName()).toBe('11 March 2026');
    await user.keyboard('{Home}');
    expect(focusedName()).toBe('9 March 2026');
    await user.keyboard('{End}');
    expect(focusedName()).toBe('15 March 2026');
    expect(tabbableCells()).toHaveLength(1);
    expect(tabbableCells()[0]).toHaveAttribute('aria-label', '15 March 2026');
  });

  it('Home respects weekStartsOn 0', async () => {
    const user = userEvent.setup();
    setup({ value: { start: '2026-03-11', end: null }, weekStartsOn: 0 });
    cell('11 March 2026').focus();
    await user.keyboard('{Home}');
    expect(focusedName()).toBe('8 March 2026');
    await user.keyboard('{End}');
    expect(focusedName()).toBe('14 March 2026');
  });

  it('PageDown / PageUp change the month and clamp the day', async () => {
    const user = userEvent.setup();
    setup({ initialMonth: '2026-01', value: { start: '2026-01-31', end: null } });
    cell('31 January 2026').focus();
    await user.keyboard('{PageDown}');
    expect(heading()).toHaveTextContent('February 2026');
    expect(focusedName()).toBe('28 February 2026');
    await user.keyboard('{PageUp}');
    expect(heading()).toHaveTextContent('January 2026');
    expect(focusedName()).toBe('28 January 2026');
  });

  it('Enter and Space select the focused day', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Controlled initial={EMPTY} spy={spy} initialMonth="2026-03" />);
    cell('10 March 2026').focus();
    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    expect(spy).toHaveBeenLastCalledWith({ start: '2026-03-12', end: null });
    await user.keyboard('{ArrowDown} ');
    expect(spy).toHaveBeenLastCalledWith({ start: '2026-03-12', end: '2026-03-19' });
  });

  it('senior: ArrowRight from the last day moves into the next month and focus follows', async () => {
    const user = userEvent.setup();
    setup({ initialMonth: '2026-03', value: { start: '2026-03-31', end: null } });
    cell('31 March 2026').focus();
    await user.keyboard('{ArrowRight}');
    expect(heading()).toHaveTextContent('April 2026');
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(focusedName()).toBe('1 April 2026');
    expect(tabbableCells().map((c) => c.getAttribute('aria-label'))).toEqual(['1 April 2026']);
  });

  it('senior: ArrowUp from the first week moves into the previous month', async () => {
    const user = userEvent.setup();
    setup({ initialMonth: '2026-03', value: { start: '2026-03-03', end: null } });
    cell('3 March 2026').focus();
    await user.keyboard('{ArrowUp}');
    expect(heading()).toHaveTextContent('February 2026');
    expect(focusedName()).toBe('24 February 2026');
    await user.keyboard('{ArrowDown}');
    expect(heading()).toHaveTextContent('March 2026');
    expect(focusedName()).toBe('3 March 2026');
  });
});

describe('108 date range picker — status', () => {
  it('announces the prompt, the partial range and the full range', () => {
    const { unmount } = render(<DateRangePicker value={EMPTY} onChange={jest.fn()} today={TODAY} />);
    expect(screen.getByRole('status')).toHaveTextContent('Select a start date');
    unmount();
    const second = render(
      <DateRangePicker value={{ start: '2026-03-15', end: null }} onChange={jest.fn()} today={TODAY} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Start: 2026-03-15 End: not set');
    second.unmount();
    render(<DateRangePicker value={MARCH} onChange={jest.fn()} today={TODAY} />);
    expect(screen.getByRole('status')).toHaveTextContent('Start: 2026-03-15 End: 2026-03-18');
  });
});

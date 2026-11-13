import { useState } from 'react';
import { DateRange, DateRangePicker } from './date_range_picker';

/**
 * Demo harness for the release-window date range picker — auto-discovered by
 * the playground (playground/App.tsx). Renders the shipped <DateRangePicker />
 * as a controlled component with a 60-day booking window around today and a
 * JSON readout of the current range. Not part of the task: the spec is
 * README.md and the grader is date_range_picker.test.tsx.
 */
const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const now = new Date();
const TODAY = ymd(now);
const MIN = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
const MAX = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60));

export default function Demo() {
  const [value, setValue] = useState<DateRange>({ start: null, end: null });
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1);

  return (
    <div className="demo">
      <h2>Date Range Picker</h2>
      <p className="demo-note">
        Implement the calendar helpers and <code>DateRangePicker</code> in{' '}
        <code>date_range_picker.tsx</code>. Pick a release window: first click sets the start,
        hover previews, second click sets the end (swapped if earlier), third click starts over.
        Days outside the booking window ({MIN} … {MAX}) are disabled. Tab into the grid and use
        Arrow / Home / End / PageUp / PageDown / Enter — arrowing past the month edge must flip
        the month and keep focus.
      </p>
      <div className="demo-stage">
        <label>
          Week starts on{' '}
          <select value={weekStartsOn} onChange={(e) => setWeekStartsOn(Number(e.target.value) as 0 | 1)}>
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </label>
        <DateRangePicker
          key={weekStartsOn}
          value={value}
          onChange={setValue}
          min={MIN}
          max={MAX}
          weekStartsOn={weekStartsOn}
          today={TODAY}
        />
        <button type="button" onClick={() => setValue({ start: null, end: null })}>
          Clear
        </button>
        <pre className="demo-note">{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
}

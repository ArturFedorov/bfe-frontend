import { useState } from 'react';
import { Schedule, SchedulePicker } from './schedule_picker';

/**
 * Demo harness for the send schedule picker — auto-discovered by the
 * playground (playground/App.tsx). Renders the shipped <SchedulePicker /> as
 * a controlled component with a pinned "now" (so the DST examples are
 * reproducible) and a JSON readout of the current Schedule. Not part of the
 * task: the spec is README.md and the grader is schedule_picker.test.tsx.
 */
const NOW = new Date('2026-03-27T00:00:00Z');

const initial: Schedule = {
  // 09:00 London, two days before the clocks go forward — a correct
  // implementation keeps 09:00 on every row.
  startAt: '2026-03-27T09:00:00.000Z',
  timeZone: 'Europe/London',
  recurrence: 'daily',
  quietHours: null,
};

export default function Demo() {
  const [value, setValue] = useState<Schedule>(initial);

  return (
    <div className="demo">
      <h2>Send Schedule Picker</h2>
      <p className="demo-note">
        Implement the zone helpers and <code>SchedulePicker</code> in{' '}
        <code>schedule_picker.tsx</code>. &quot;Now&quot; is pinned to 2026-03-27 00:00Z so the
        default daily 09:00 London schedule crosses the 29 March clock change — the{' '}
        <strong>Next sends</strong> list must keep reading 09:00. Switch zones (wall clock is
        kept), turn on quiet hours, or move the date into the past to see the warning.
      </p>
      <div className="demo-stage">
        <SchedulePicker value={value} onChange={setValue} now={NOW} />
        <pre className="demo-note">{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
}

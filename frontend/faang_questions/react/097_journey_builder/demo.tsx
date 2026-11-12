import { useState } from 'react';
import { Journey, JourneyBuilder } from './journey_builder';

/**
 * Demo harness for the journey builder — auto-discovered by the playground
 * (playground/App.tsx). Renders the shipped <JourneyBuilder /> as a controlled
 * component seeded with an onboarding journey, next to a JSON readout of the
 * current graph. Not part of the task: the spec is README.md and the grader is
 * journey_builder.test.tsx.
 */
const initial: Journey = {
  steps: [
    { id: 'trigger', kind: 'trigger', label: 'Signed up', config: {} },
    { id: 'wait-1d', kind: 'wait', label: 'Wait 1 day', config: { days: 1 } },
    { id: 'welcome', kind: 'message', label: 'Welcome email', config: { channel: 'email' } },
    { id: 'opened', kind: 'branch', label: 'Opened welcome?', config: { field: 'opened' } },
    { id: 'discount', kind: 'message', label: 'Discount push', config: { channel: 'push' } },
    { id: 'reminder', kind: 'message', label: 'Reminder SMS', config: { channel: 'sms' } },
    { id: 'exit', kind: 'exit', label: 'Done', config: {} },
  ],
  edges: [
    { from: 'trigger', to: 'wait-1d' },
    { from: 'wait-1d', to: 'welcome' },
    { from: 'welcome', to: 'opened' },
    { from: 'opened', to: 'discount', when: 'yes' },
    { from: 'opened', to: 'reminder', when: 'no' },
    { from: 'discount', to: 'exit' },
    { from: 'reminder', to: 'exit' },
  ],
};

let counter = 0;
const newId = () => `step-${++counter}`;

export default function Demo() {
  const [value, setValue] = useState<Journey>(initial);

  return (
    <div className="demo">
      <h2>Journey Builder</h2>
      <p className="demo-note">
        Implement <code>validateJourney</code>, <code>simulate</code> and{' '}
        <code>JourneyBuilder</code> in <code>journey_builder.tsx</code>. Add steps after a
        wait, delete the branch&apos;s yes target to see a dangling branch, point{' '}
        <strong>No →</strong> back at the wait to create a cycle, then simulate{' '}
        <code>{'{"opened": true}'}</code> to watch the path change.
      </p>
      <div className="demo-stage">
        <JourneyBuilder value={value} onChange={setValue} newId={newId} />
        <pre className="demo-note">{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Channel, TemplateBlock, TemplateEditor } from './template_editor';

/**
 * Demo harness for the message template editor — auto-discovered by the
 * playground (playground/App.tsx). Renders the shipped <TemplateEditor /> as
 * a controlled component with sample variables, two content blocks and a
 * channel switch, so the SMS counter and the problems alert can be exercised
 * by hand. Not part of the task: the spec is README.md and the grader is
 * template_editor.test.tsx.
 */
const blocks: TemplateBlock[] = [
  { id: 'hero-1', label: 'Hero banner', text: 'Our biggest summer sale is on' },
  { id: 'footer-legal', label: 'Legal footer', text: 'Reply STOP to opt out' },
];

const variables = { first_name: 'Ada', city: 'Zurich', plan: 'Pro' };

const CHANNELS: Channel[] = ['email', 'push', 'sms'];

export default function Demo() {
  const [value, setValue] = useState(
    'Hi {{first_name | there}}, {{block:hero-1}} in {{city}}. Upgrade to {{plan}} today!\n{{block:footer-legal}}',
  );
  const [channel, setChannel] = useState<Channel>('sms');

  return (
    <div className="demo">
      <h2>Message Template Editor</h2>
      <p className="demo-note">
        Implement <code>tokenizeTemplate</code>, <code>renderTemplate</code> and{' '}
        <code>TemplateEditor</code> in <code>template_editor.tsx</code>. Type{' '}
        <code>{'{{unknown}}'}</code> or leave a <code>{'{{'}</code> open to see the problems
        alert, escape with <code>{'\\{{'}</code>, insert a block at the caret, and switch to
        SMS to watch the 160-character counter go over.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            Channel{' '}
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <span>
            variables: <code>{JSON.stringify(variables)}</code>
          </span>
        </div>
        <TemplateEditor
          value={value}
          onChange={setValue}
          variables={variables}
          blocks={blocks}
          channel={channel}
        />
      </div>
    </div>
  );
}

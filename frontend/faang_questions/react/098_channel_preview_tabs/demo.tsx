import { useState } from 'react';
import { ChannelTabs } from './channel_tabs';
import { channelWidth, color, radius, space } from './tokens';

/**
 * Demo harness for ChannelTabs — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is channel_tabs.test.tsx.
 */

const MESSAGE = {
  subject: 'Your Q4 loyalty rewards are ready',
  body: 'Hi Jordan — you have 1,240 points waiting. Redeem them before Dec 31 and get a bonus 10%.',
  cta: 'Redeem now',
};

function EmailPreview() {
  return (
    <div style={{ fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
      <p style={{ margin: 0, color: color.textMuted, fontSize: 12 }}>From: Northwind Rewards</p>
      <h3 style={{ margin: `${space[2]}px 0` }}>{MESSAGE.subject}</h3>
      <p>{MESSAGE.body}</p>
      <button type="button">{MESSAGE.cta}</button>
    </div>
  );
}

function PushPreview() {
  return (
    <div style={{ display: 'flex', gap: space[3], alignItems: 'flex-start' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.sm,
          background: color.accent,
          flexShrink: 0,
        }}
      />
      <div>
        <strong style={{ display: 'block' }}>{MESSAGE.subject}</strong>
        <span style={{ color: color.textMuted, fontSize: 13 }}>{MESSAGE.body.slice(0, 80)}…</span>
      </div>
    </div>
  );
}

function InAppPreview() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 600, margin: `0 0 ${space[2]}px` }}>{MESSAGE.subject}</p>
      <p style={{ fontSize: 14, color: color.textMuted }}>{MESSAGE.body}</p>
      <button type="button">{MESSAGE.cta}</button>
    </div>
  );
}

export default function Demo() {
  const [controlled, setControlled] = useState(false);
  const [value, setValue] = useState('email');
  const [log, setLog] = useState<string[]>([]);

  const onChange = (next: string) => {
    setLog((l) => [`onChange(${JSON.stringify(next)})`, ...l].slice(0, 6));
    if (controlled) setValue(next);
  };

  return (
    <div className="demo">
      <h2>Channel Preview Tabs</h2>
      <p className="demo-note">
        Implement <code>cx</code> in <code>tokens.ts</code> and the compound{' '}
        <code>ChannelTabs</code> (<code>List</code>, <code>Tab</code>, <code>Panel</code>) in{' '}
        <code>channel_tabs.tsx</code>: WAI-ARIA tabs with roving tabindex, automatic activation on{' '}
        <kbd>←</kbd>/<kbd>→</kbd> (wrapping), <kbd>Home</kbd>/<kbd>End</kbd>, hidden inactive
        panels and a preview frame sized from <code>channelWidth</code> (email{' '}
        {channelWidth.email}px, push {channelWidth.push}px, in-app {channelWidth['in-app']}px).
        Toggle controlled mode to see the component defer to the parent: in controlled mode the
        parent applies <code>onChange</code>; in uncontrolled mode it only logs it.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            <input
              type="checkbox"
              checked={controlled}
              onChange={(e) => setControlled(e.target.checked)}
            />{' '}
            Controlled by parent (value = {JSON.stringify(value)})
          </label>
          {controlled && (
            <button type="button" onClick={() => setValue('push')}>
              Parent: jump to Push
            </button>
          )}
        </div>
        <ChannelTabs
          key={controlled ? 'controlled' : 'uncontrolled'}
          label="Channel preview"
          value={controlled ? value : undefined}
          defaultValue={controlled ? undefined : 'email'}
          onChange={onChange}
        >
          <ChannelTabs.List>
            <ChannelTabs.Tab value="email">Email</ChannelTabs.Tab>
            <ChannelTabs.Tab value="push">Push</ChannelTabs.Tab>
            <ChannelTabs.Tab value="in-app">In-app</ChannelTabs.Tab>
          </ChannelTabs.List>
          <ChannelTabs.Panel value="email" channel="email">
            <EmailPreview />
          </ChannelTabs.Panel>
          <ChannelTabs.Panel value="push" channel="push">
            <PushPreview />
          </ChannelTabs.Panel>
          <ChannelTabs.Panel value="in-app" channel="in-app">
            <InAppPreview />
          </ChannelTabs.Panel>
        </ChannelTabs>
        <p className="demo-note">
          onChange log: {log.length === 0 ? 'none yet' : log.join(' · ')}
        </p>
      </div>
    </div>
  );
}

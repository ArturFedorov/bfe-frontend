import { memo, useRef, useState } from 'react';
import { Feature, FlagsProvider, useFlag, useFlagOverride, useFlags } from './feature_flags';

/**
 * Demo harness for the feature-flag store — auto-discovered by the playground
 * (playground/App.tsx). "Server flags" are the checkboxes on the left; the
 * override panel is what a QA overlay would use, persisted to localStorage.
 * Each consumer shows its own render count so you can see isolation: flipping
 * one flag must not bump the others. Not part of the task: the spec lives in
 * README.md and the grader is feature_flags.test.tsx.
 */

const SERVER_FLAGS: Record<string, boolean> = {
  'audience-builder': true,
  'push-preview': false,
  'approvals-redesign': false,
};

function FlagCard({ name }: { name: string }) {
  const renders = useRef(0);
  renders.current += 1;
  const on = useFlag(name);
  return (
    <div
      style={{
        border: '1px solid #d2d2d7',
        borderRadius: 8,
        padding: '0.5rem 0.75rem',
        background: on ? '#f0fdf4' : '#fff7ed',
      }}
    >
      <strong>{name}</strong>: {on ? 'on' : 'off'}
      <span style={{ float: 'right', color: '#6e6e73' }}>renders: {renders.current}</span>
    </div>
  );
}

function ChannelSummary() {
  const renders = useRef(0);
  renders.current += 1;
  const enabled = useFlags(
    (f) => Object.keys(f).filter((k) => f[k]).length,
  );
  return (
    <p>
      {enabled} flag(s) enabled · summary renders: {renders.current}
    </p>
  );
}

// memo() so the parent's re-render cannot reach the consumers — only the store can.
const Consumers = memo(function Consumers() {
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {Object.keys(SERVER_FLAGS).map((name) => (
        <FlagCard key={name} name={name} />
      ))}
      <ChannelSummary />
      <Feature flag="approvals-redesign" fallback={<p>Approvals: classic list view</p>}>
        <p>Approvals: new grid view</p>
      </Feature>
    </div>
  );
});

function OverridePanel() {
  const { set, overrides } = useFlagOverride();
  return (
    <fieldset>
      <legend>Local overrides (persisted to localStorage)</legend>
      {Object.keys(SERVER_FLAGS).map((name) => {
        const value = overrides[name];
        return (
          <div key={name}>
            <span style={{ display: 'inline-block', minWidth: 170 }}>{name}</span>
            <label>
              <input type="radio" name={`ov-${name}`} checked={value === undefined} onChange={() => set(name, null)} />{' '}
              inherit
            </label>{' '}
            <label>
              <input type="radio" name={`ov-${name}`} checked={value === true} onChange={() => set(name, true)} />{' '}
              force on
            </label>{' '}
            <label>
              <input type="radio" name={`ov-${name}`} checked={value === false} onChange={() => set(name, false)} />{' '}
              force off
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}

export default function Demo() {
  const [flags, setFlags] = useState(SERVER_FLAGS);
  return (
    <div className="demo">
      <h2>Feature Flag Context</h2>
      <p className="demo-note">
        Implement <code>FlagsProvider</code>, <code>useFlag</code>, <code>useFlags</code>,{' '}
        <code>useFlagOverride</code> and <code>Feature</code> in <code>feature_flags.tsx</code> on
        top of <code>useSyncExternalStore</code>. Flip a server flag or set an override and watch
        the render counters: only the card for that flag (and the summary, whose selection changed)
        should re-render. Overrides survive a reload via <code>localStorage</code> under{' '}
        <code>flag-overrides</code>.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          {Object.keys(SERVER_FLAGS).map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={flags[name]}
                onChange={(e) => setFlags((f) => ({ ...f, [name]: e.target.checked }))}
              />{' '}
              server: {name}
            </label>
          ))}
        </div>
        <FlagsProvider flags={flags} storage={window.localStorage}>
          <Consumers />
          <OverridePanel />
        </FlagsProvider>
      </div>
    </div>
  );
}

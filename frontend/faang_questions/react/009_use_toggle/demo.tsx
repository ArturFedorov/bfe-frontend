import { useToggle } from './use_toggle';

/**
 * Demo harness for useToggle — auto-discovered by the playground.
 * A raw-payload panel driven entirely by the hook's stable handlers.
 */
const SAMPLE_PAYLOAD = JSON.stringify(
  {
    partnerId: 'p-4821',
    event: 'delivery.completed',
    asset: 'stranger-things-s05e01-4k-hdr',
    checksum: 'sha256:9f2c…d41a',
  },
  null,
  2
);

function RawPayloadPanel() {
  const [visible, toggle, show, hide] = useToggle();

  return (
    <section>
      <div className="demo-controls">
        <button onClick={toggle}>{visible ? 'Hide' : 'Show'} raw payload (toggle)</button>
        <button onClick={show}>Force show (setOn)</button>
        <button onClick={hide}>Force hide (setOff)</button>
        <span>
          value: <code>{String(visible)}</code>
        </span>
      </div>
      {visible && <pre onDoubleClick={hide}>{SAMPLE_PAYLOAD}</pre>}
    </section>
  );
}

function MaintenanceBanner() {
  const [on, toggle] = useToggle(true);
  return (
    <div className="demo-controls">
      <button onClick={toggle}>Toggle maintenance banner (initial: true)</button>
      {on && <strong>Maintenance window: Sat 02:00–04:00 UTC</strong>}
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>useToggle</h2>
      <p className="demo-note">
        Implement <code>useToggle</code> in <code>use_toggle.ts</code> — a
        boolean state hook returning <code>[value, toggle, setOn, setOff]</code>{' '}
        with referentially stable handlers.
      </p>
      <div className="demo-stage">
        <RawPayloadPanel />
        <MaintenanceBanner />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useEventListener } from './use_event_listener';

/**
 * Demo harness for useEventListener — auto-discovered by the playground.
 * Two window subscriptions (keydown + resize) and a detach toggle that passes
 * a null target — nothing may subscribe or throw while detached.
 */
function GlobalListeners() {
  const [attached, setAttached] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [keyCount, setKeyCount] = useState(0);
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const target = attached ? window : null;

  useEventListener<KeyboardEvent>(target, 'keydown', (e) => {
    // Handler closes over current state — the latest-ref pattern must keep
    // this fresh without re-subscribing on every render.
    setLastKey(e.key);
    setKeyCount((c) => c + 1);
  });

  useEventListener(target, 'resize', () => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  });

  return (
    <div>
      <div className="demo-controls">
        <button onClick={() => setAttached((a) => !a)}>
          {attached ? 'Detach listeners (target = null)' : 'Attach listeners'}
        </button>
      </div>
      <p>
        Last key pressed: <code>{lastKey ?? '—'}</code> ({keyCount} keydowns
        seen)
      </p>
      <p>
        Window size: <code>{size.width} × {size.height}</code> — resize the
        browser to update.
      </p>
      <p>
        Press keys and resize while detached: the readouts must freeze, and
        re-attaching must resume without duplicate events.
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>useEventListener</h2>
      <p className="demo-note">
        Implement <code>useEventListener</code> in{' '}
        <code>use_event_listener.ts</code> — add/remove pairing done right: one
        stable wrapper listener, latest-handler semantics without
        re-subscribing, and a null target subscribes nothing.
      </p>
      <div className="demo-stage">
        <GlobalListeners />
      </div>
    </div>
  );
}

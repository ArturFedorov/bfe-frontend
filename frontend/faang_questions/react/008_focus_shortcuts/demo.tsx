import { useState } from 'react';
import { PartnerAccessForm, type PartnerAccessFormValues } from './focus_shortcuts';

/**
 * Demo harness for PartnerAccessForm — auto-discovered by the playground.
 * Try: press "/" anywhere to jump to search, Escape to clear it, and submit
 * half-filled — focus must land on the first invalid field.
 */
export default function Demo() {
  const [grants, setGrants] = useState<PartnerAccessFormValues[]>([]);

  return (
    <div className="demo">
      <h2>Focus Shortcuts</h2>
      <p className="demo-note">
        Implement <code>PartnerAccessForm</code> in{' '}
        <code>focus_shortcuts.tsx</code> — keyboard-first imperative focus:
        <code>/</code> jumps to search (without typing a slash),{' '}
        <code>Escape</code> clears and blurs it, and a failed submit focuses the
        first invalid field.
      </p>
      <div className="demo-stage">
        <PartnerAccessForm onSubmit={(values) => setGrants((g) => [...g, values])} />
        <h3>Granted access</h3>
        {grants.length === 0 ? (
          <p>No grants yet — submit a valid Partner ID and Contact email.</p>
        ) : (
          <ul>
            {grants.map((g, i) => (
              <li key={i}>
                <code>{g.partnerId}</code> → {g.contactEmail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

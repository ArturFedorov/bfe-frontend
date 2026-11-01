import { StatusBadge } from './status_badge';

/**
 * Demo harness for StatusBadge — auto-discovered by the playground
 * (playground/App.tsx). Tweak the sample props as you build the component.
 * This file is not part of the task: the spec lives in README.md and the
 * grader is status_badge.test.tsx.
 */
export default function Demo() {
  return (
    <div className="demo">
      <h2>Status Badge</h2>
      <p className="demo-note">
        Implement <code>StatusBadge</code> in <code>status_badge.tsx</code> —
        one badge per known integration status, plus an unknown-status
        fallback.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <StatusBadge status="connected" />
          <StatusBadge status="degraded" />
          <StatusBadge status="disconnected" />
          <StatusBadge status="pending" />
          <StatusBadge status="something-new-from-api" />
        </div>
      </div>
    </div>
  );
}

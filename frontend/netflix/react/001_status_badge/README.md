# 001. Status Badge

**Difficulty:** Very Easy
**Topics:** Components, Typed Props, Rendering, Fallbacks

---

## Scenario

The integration monitoring dashboard lists every partner pipeline with a small
status badge next to its name. The backend reports one of four known statuses —
`connected`, `degraded`, `disconnected`, `pending` — but new backend releases
occasionally ship statuses the frontend has never seen. The dashboard must never
crash or render an empty badge because of an unrecognized status string; it
should fall back to a neutral "Unknown" badge instead. Your job is the badge
component itself: map status to a human-readable label and a color variant.

## Acceptance Criteria

- Renders a single element with `role="status"` whose text is the human label
  for the given status: `connected` → `Connected`, `degraded` → `Degraded`,
  `disconnected` → `Disconnected`, `pending` → `Pending`.
- Applies a variant class `badge badge--<variant>`: `success`, `warning`,
  `danger`, `info` for the four known statuses respectively.
- Any unrecognized status string renders the label `Unknown` with the
  `badge--neutral` variant — no throw, no empty render.
- The label is rendered as visible text (no icon-only rendering) so screen
  readers announce status changes via the live region.

## Example

```ts
<StatusBadge status="connected" />    // <span role="status" class="badge badge--success">Connected</span>
<StatusBadge status="degraded" />     // Degraded / badge--warning
<StatusBadge status="EXPERIMENTAL" /> // Unknown / badge--neutral
```

## Target

Unknown input can never break the render — every status string maps to a safe, labeled badge.

## Interviewer follow-up

How would you type the `status` prop so callers get autocomplete for the known
statuses while still accepting arbitrary strings from the API?

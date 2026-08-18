# 007. Metric Delta

**Difficulty:** Medium
**Topics:** useRef, useEffect, usePrevious, Render Timing

---

## Scenario

The delivery dashboard shows live throughput metrics — "Assets delivered this
hour: 128" — that update every time the polling layer pushes new props. Ops
asked for a small delta indicator next to each number: how much it changed
since the last update, so a sudden drop stands out. That requires remembering
the value from the previous render, and holding it in `useState` triggers the
update-inside-render trap or an extra render pass. Implement the standard
`usePrevious` ref pattern and a `MetricDelta` component built on it.

## Acceptance Criteria

- `usePrevious<T>(value)` returns `undefined` on the first render and the value
  from the immediately preceding render afterwards; storing it must not cause
  extra renders (ref, not state).
- `MetricDelta` renders as a `role="group"` with the metric `label` as its
  accessible name, containing the label and the current value.
- Delta text: first render shows `—` (no previous data); subsequent renders
  show `+N` for increases, `-N` for decreases, and `0` when the value equals
  the previous render's value.
- The delta compares against the previous render, not the previous distinct
  value: re-rendering twice with the same value shows `0`.

## Example

```ts
<MetricDelta label="Assets delivered" value={128} />
// first render:            Assets delivered 128 —
// after rerender with 131: Assets delivered 131 +3
// after rerender with 131: Assets delivered 131 0
// after rerender with 129: Assets delivered 129 -2
```

## Target

The previous render's value is captured in a ref during the commit phase — readable during the next render, with zero extra renders.

## Interviewer follow-up

Why can't `usePrevious` be implemented with `useState` plus a setter call
during render — and what does React 19's `useEffect` timing mean for reading
the ref in the same render you update it?

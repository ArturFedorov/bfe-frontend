# 041. Memo Boundaries

Difficulty: Medium
Topics: React.memo, referential stability, useCallback, identity churn

## Scenario

The delivery-status dashboard renders 100 rows. Ops complains that typing in the "Shift notes" field is laggy and CPU spikes on every keystroke. Profiling shows all 100 `Row` components re-render on ANY parent state change — even changes no row cares about.

This is a **fix-the-code** task: `memo_boundaries.tsx` ships with a working-but-slow implementation (marked `// TODO: fix the performance problem below`). Behavior is correct; render behavior is not. Find every source of identity churn that would defeat `React.memo`, then draw the boundary.

### Render-count convention

Components accept an optional `onRender?: (id: string) => void` probe prop and call it at the top of their function body (`'table'`, `'row-d-5'`, …). The tests pass a `jest.fn()` and count calls per id — do not remove or move these calls.

## Acceptance Criteria

- All behavior tests keep passing: 100 rows render, selecting toggles/moves the `(selected)` mark, the notes input stays controlled.
- Typing in the notes field re-renders **zero** rows.
- Selecting a row re-renders **only** that row; moving the selection re-renders only the two affected rows.
- Every row still renders exactly once on mount (no lazy tricks, no hiding rows).
- Row identity and DOM structure unchanged (`key={delivery.id}`, same markup).

## Example

```tsx
const probe = jest.fn();
render(<DeliveryTable onRender={probe} />);
probe.mockClear();
await user.type(screen.getByLabelText('Shift notes'), 'abc');
// after the fix: probe was never called with any 'row-*' id
```

## Target

Render budget per interaction (N = 100 rows):

- Unrelated parent state change (notes keystroke): **0** row renders (was 100 per keystroke).
- Selection change: **O(1)** row renders — exactly the rows whose `isSelected` flipped (was 100).
- Mount: exactly N row renders (unchanged).

## Interviewer follow-up

- The inline `onSelect={(id) => …}` arrow was one culprit. If you had written `useCallback((id) => setSelectedId(selectedId === id ? null : id), [selectedId])`, would the fix still work? What is the difference versus the functional-update form?
- Why did `React.memo(Row)` alone (without stabilizing the callback) change nothing?
- When is `React.memo` a net LOSS? What does the shallow comparison itself cost?
- The `delivery` objects come from a module-level array here, so they are stable. What breaks if the rows arrive from a fetch that re-creates the array each poll — and where would you fix that?

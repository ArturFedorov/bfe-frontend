# 039. Context Splitting

Difficulty: Hard

Topics: context performance, state/dispatch split, React.memo, render counting

## Scenario

The delivery-status dashboard has one `DashboardContext` that carries
`{ state, dispatch }` in a single object. Every widget consumes it — including a
toolbar of action buttons that only ever *dispatch* and never read state. Each
poll tick updates the state, the provider builds a fresh `{ state, dispatch }`
object, and every memoized consumer re-renders, buttons included. The laggy
baseline (`LaggyDashboardProvider` / `useLaggyDashboard`) is given in the stub —
do not fix it; it is the control group. Build the fixed version alongside it:
split state and dispatch into two contexts so dispatch-only consumers stop
re-rendering, and the tests prove it with render counters.

## Acceptance Criteria

- Keep `LaggyDashboardProvider` / `useLaggyDashboard` exactly as given.
- `DashboardProvider` holds the same reducer (`dashboardReducer`,
  `initialDashboardState`) but provides **two contexts**: one carrying the state
  value, one carrying the stable `dispatch` from `useReducer`.
- `useDashboardState()` returns the current `DashboardState`;
  `useDashboardDispatch()` returns `Dispatch<DashboardAction>`. Each throws a
  helpful error naming `DashboardProvider` when used outside it.
- After a state update, a memoized component that only calls
  `useDashboardDispatch()` does **not** re-render (the dispatch identity is
  stable across renders); a component calling `useDashboardState()` re-renders
  and shows fresh data.
- The laggy baseline keeps its documented flaw: dispatch-only consumers re-render
  on every state change.

## Example

```tsx
const RefreshButton = memo(function RefreshButton() {
  const dispatch = useDashboardDispatch();
  return <button onClick={() => dispatch({ type: 'refresh' })}>Refresh</button>;
});
// Clicking Refresh updates state consumers; RefreshButton itself never re-renders.
```

## Target

- Two contexts, two hooks, one provider — no memoizing of the context value
  object needed once the split is done.
- Consumers must be wrapped in `React.memo` for the fix to be observable (the
  tests do this) — know why.
- ~40 new lines.

## Interviewer follow-up

- Why does `React.memo` on the consumer matter here — what re-renders a context
  consumer besides context changes?
- When is `useMemo` on the context value enough, and when is splitting contexts
  strictly better?
- How does this pattern scale to three concerns (state, dispatch, derived
  selectors)? When do you reach for an external store / `useSyncExternalStore`?

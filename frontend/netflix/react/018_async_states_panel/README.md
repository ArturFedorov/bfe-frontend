# 018. Async States Panel

**Difficulty:** Easy
**Topics:** Discriminated Unions, Impossible States, Loading/Error/Empty UX

---

## Scenario

Every screen in the partner portal renders the same four fetch states — loading
skeleton, error with retry, empty, and data — but each team hand-rolls them
with separate `isLoading`/`error`/`data` booleans, and QA keeps finding screens
showing a spinner AND an error at once. Build the canonical panel that takes a
single discriminated-union result (the shape a data hook would return) and can
only ever render one state.

## Acceptance Criteria

- Exports `AsyncResult<T>` as a discriminated union:
  `{ status: 'loading' }` | `{ status: 'error'; error: Error }` |
  `{ status: 'success'; data: T[] }`. Impossible combinations
  (loading + data, error + data) must be unrepresentable in the type.
- `status: 'loading'` → renders a skeleton with `role="status"` and the text
  `'Loading partners…'`. Nothing else renders.
- `status: 'error'` → renders the error message inside `role="alert"` plus a
  `'Retry'` button that calls the `onRetry` prop. Nothing else renders.
- `status: 'success'` with `data.length === 0` → renders the empty state
  `'No partners found'` (empty is derived from success, not a fifth flag).
- `status: 'success'` with data → renders a `role="list"` of partner names as
  list items. No status, alert, or retry button present.
- A11y: loading announced via `role="status"`, error via `role="alert"`, data
  as a semantic list, retry is a real button.

## Example

```tsx
<AsyncStatesPanel result={{ status: 'loading' }} onRetry={refetch} />
<AsyncStatesPanel
  result={{ status: 'success', data: [{ id: 'p1', name: 'Acme Studios' }] }}
  onRetry={refetch}
/>
```

## Target

10–15 minutes. The senior signal is the union type itself — one `switch` on
`status`, zero boolean juggling, and TypeScript exhaustiveness doing the QA.

## Interviewer follow-up

A teammate wants to add `{ status: 'refreshing' }` that shows stale data with
a spinner overlay. How would you extend the union without reintroducing
impossible states, and what does the exhaustive `switch` buy you here?

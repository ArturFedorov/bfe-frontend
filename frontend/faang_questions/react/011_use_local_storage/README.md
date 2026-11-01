# 011. useLocalStorage

**Difficulty:** Medium
**Topics:** Custom Hooks, Lazy Initialization, JSON Serialization, Error Handling

---

## Scenario

Ops engineers tune the delivery dashboard constantly — column visibility,
rows-per-page, collapsed sidebar — and lose it all on every refresh. Persist
these preferences in `localStorage` behind a drop-in `useState` replacement:
`useLocalStorage(key, initial)`. It must survive the real world: another tool
once wrote raw (non-JSON) text under a shared key and took the whole dashboard
down with a `JSON.parse` throw during render.

## Acceptance Criteria

- `useLocalStorage<T>(key, initial)` returns `[value, setValue]`, mirroring
  `useState`.
- On mount, reads `localStorage.getItem(key)` and `JSON.parse`s it; when the
  key is absent, falls back to `initial`.
- `initial` may be a value or a lazy initializer function; a lazy initializer
  is called **at most once** (never again on re-renders).
- If the stored string is corrupt (invalid JSON) or storage access throws, the
  hook falls back to `initial` — it must never throw during render.
- `setValue(next)` updates React state **and** writes
  `JSON.stringify(next)` to `localStorage` under the same key.
- `setValue` accepts functional updates: `setValue(prev => ...)` receives the
  current value and persists the computed result.
- `setValue` keeps a stable identity across re-renders (same reference).

## Example

```ts
function DeliveryTableSettings() {
  const [pageSize, setPageSize] = useLocalStorage<number>('deliveries.pageSize', 25);
  return (
    <select
      aria-label="Rows per page"
      value={pageSize}
      onChange={(e) => setPageSize(Number(e.target.value))}
    >
      {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}
```

## Target

Lazy `useState` initializer does the read + parse + fallback; `setValue` is
one stable `useCallback` that persists inside a functional update.

## Interviewer follow-up

Two dashboard tabs are open side by side — how would you keep the hook's
value in sync across tabs, and why doesn't the `storage` event fire in the
tab that wrote the change?

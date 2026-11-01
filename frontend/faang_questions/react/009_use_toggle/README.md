# 009. useToggle

**Difficulty:** Very Easy
**Topics:** Custom Hooks, useState, useCallback, Referential Stability

---

## Scenario

Every panel in the partner portal has some piece of boolean UI: a filters
drawer, a "show raw payload" switch, a maintenance-mode banner. Each screen
re-implements the same three handlers inline, and because the handlers are
recreated on every render they defeat `React.memo` on the heavy child panels.
Extract the pattern into a `useToggle` hook the whole dashboard team can use —
with function identities stable enough to pass straight into memoized children.

## Acceptance Criteria

- `useToggle(initial?)` returns a tuple `[value, toggle, setOn, setOff]`.
- `initial` defaults to `false` when omitted.
- `toggle()` flips the current value; calling it twice returns to the start.
- `setOn()` forces the value to `true`; `setOff()` forces it to `false`; both
  are idempotent (calling them repeatedly keeps the forced value).
- `toggle`, `setOn`, and `setOff` keep the **same function reference** across
  re-renders and across state changes (safe to pass to `React.memo` children
  and effect dependency arrays).
- `toggle` must be safe under batched/repeated calls in one event (functional
  update, not a captured stale value).

## Example

```ts
function RawPayloadPanel({ payload }: { payload: string }) {
  const [visible, toggle, , hide] = useToggle();
  return (
    <section>
      <button onClick={toggle}>{visible ? 'Hide' : 'Show'} raw payload</button>
      {visible && <pre onDoubleClick={hide}>{payload}</pre>}
    </section>
  );
}
```

## Target

A one-look implementation: one `useState`, three `useCallback`s with empty
dependency arrays, functional updates only.

## Interviewer follow-up

If a consumer needs `setValue(next: boolean)` too, do you add a fifth tuple
element or switch to an object return — and what does each choice do to
existing call sites?

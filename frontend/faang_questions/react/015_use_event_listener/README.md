# 015. useEventListener

**Difficulty:** Medium
**Topics:** Custom Hooks, Event Listeners, Refs, Effect Cleanup Pairing

---

## Scenario

The delivery dashboard subscribes to global events everywhere: `keydown` for
shortcuts, `resize` for the virtualized log table, `visibilitychange` to pause
polling. One screen leaked listeners for weeks because the cleanup removed a
*different* function reference than the one added — inline handlers are new on
every render. Another screen tore down and re-added its listener on every
keystroke because the handler sat in the effect deps. Build
`useEventListener(target, type, handler)` that gets the add/remove pairing
right once, for everyone.

## Acceptance Criteria

- `useEventListener(target, type, handler)` subscribes on mount and
  unsubscribes on unmount; `removeEventListener` is called with the **same
  listener reference** (and same type) that `addEventListener` received.
- Dispatched events invoke `handler` with the event object.
- **Handler swap does not re-subscribe:** re-rendering with a new `handler`
  calls `addEventListener` no additional times and `removeEventListener` not
  at all — yet subsequent events invoke the *new* handler (latest-ref
  pattern), never the old one.
- Changing `target` or `type` unsubscribes from the old pair and subscribes
  to the new one.
- `target` may be `null` (e.g. a ref not yet attached): nothing is subscribed,
  nothing throws.

## Example

```ts
function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  useEventListener<KeyboardEvent>(window, 'keydown', (e) => {
    if (e.key === '?') setOpen(true);
    if (e.key === 'Escape') setOpen(false);
  });
  return open ? <dialog open>Keyboard shortcuts…</dialog> : null;
}
```

## Target

One ref mirroring the handler + one effect keyed on `[target, type]` that adds
a single stable wrapper calling `ref.current(event)`.

## Interviewer follow-up

How would you extend the signature to accept a React ref object
(`RefObject<HTMLElement>`) as the target, and why does reading `ref.current`
inside the effect (not during render) make that work?

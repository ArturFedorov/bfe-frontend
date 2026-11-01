# 032. Toast System

**Difficulty:** Hard
**Topics:** Context API, Portals, Timer Management, Queueing, Live Regions

---

## Scenario

Every tool in the portal grew its own notification hack — inline banners,
`alert()`, a `<div>` appended to body. Build the one true toast system:
`ToastProvider` owns the queue, any component calls `useToast().show('Sync
complete')`, and `ToastViewport` portals the stack into `document.body`. Ops
users leave dashboards open all day, so the details matter: toasts must
auto-dismiss, pause their timer while hovered (they are reading it), cap how
many are on screen at once (queue the rest), and announce through a live
region so screen-reader users hear them without focus ever moving.

## Acceptance Criteria

- `ToastProvider` props: `maxVisible?: number` (default 3), `duration?: number`
  ms (default 5000). `useToast()` outside a provider throws
  `useToast must be used within <ToastProvider>`.
- `useToast()` returns `{ show, dismiss }`; `show(message, options?)` enqueues
  a toast and returns its generated id; `options.duration` overrides the
  provider default for that toast. `dismiss(id)` removes a toast immediately.
- `ToastViewport` renders via `createPortal` into `document.body`: a container
  with `role="status"`, `aria-live="polite"`, and accessible name
  `Notifications` — outside the React root container.
- At most `maxVisible` toasts render at once, oldest first; extra toasts wait
  in a queue and appear (with a fresh timer) as visible slots free up.
- Each visible toast auto-dismisses after its duration (deterministic with
  fake timers). Queued toasts must NOT burn their timer while waiting.
- Pause on hover: while the pointer is over a toast, its timer stops; on
  leave, it resumes with the *remaining* time, not a full restart.
- Each toast renders a close button (accessible name `Dismiss`) that removes
  it immediately.
- All timers are cleaned up on unmount — no setState after unmount, no
  leaked timeouts.

## Example

```tsx
<ToastProvider maxVisible={3} duration={5000}>
  <SyncButton />        {/* calls useToast().show('Sync complete') */}
  <ToastViewport />
</ToastProvider>
```

## Target

- `ToastProvider(props: ToastProviderProps): ReactElement` — `{ maxVisible?: number; duration?: number; children: ReactNode }`
- `useToast(): ToastHandle` — `{ show: (message: string, options?: ShowToastOptions) => string; dismiss: (id: string) => void }`
- `ShowToastOptions`: `{ duration?: number }`
- `ToastViewport(): ReactElement`

## Interviewer follow-up

You chose `role="status"` / `aria-live="polite"` for the region. When would a
toast deserve `role="alert"` (assertive), why is putting `role="alert"` on the
*container* a bug, and how do you make sure a toast that appears and
auto-dismisses in 5s was actually announced?

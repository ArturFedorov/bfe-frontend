# 029. Modal Portal

**Difficulty:** Medium
**Topics:** createPortal, Focus Management, Effects & Cleanup, Dialog A11y

---

## Scenario

The "Edit partner settings" dialog currently renders inline inside a table
cell, so it inherits `overflow: hidden` from the table wrapper and gets clipped
— the classic reason modals exist as portals. Rebuild it as a `Modal` rendered
into `document.body` via `createPortal`, with the full dialog contract: focus
moves in on open and returns to the trigger on close, Escape and backdrop click
close it, and the page behind it cannot scroll while it is open. The component
is controlled: the parent owns `open` and passes `onClose`.

## Acceptance Criteria

- When `open` is true, renders via `createPortal` into `document.body` — the
  dialog must NOT be inside the React root container (tests assert via
  `baseElement` vs `container`). When `open` is false, renders nothing.
- The dialog element has `role="dialog"`, `aria-modal="true"`, and is labelled
  by the rendered `title` heading (`aria-labelledby`).
- On open, focus moves to the dialog element (it has `tabIndex={-1}`).
- On close (for any reason, including unmount), focus returns to the element
  that was focused before the modal opened — the trigger button.
- Pressing Escape calls `onClose`.
- Clicking the backdrop (outside the dialog) calls `onClose`; clicking inside
  the dialog content does not.
- While open, `document.body.style.overflow` is `'hidden'`; it is restored to
  its previous value on close/unmount (scroll lock).
- All listeners and body styles are cleaned up on unmount — no leaks between
  opens.

## Example

```tsx
const [open, setOpen] = useState(false);
<button onClick={() => setOpen(true)}>Edit settings</button>
<Modal open={open} onClose={() => setOpen(false)} title="Partner settings">
  <label>Webhook URL <input /></label>
</Modal>
```

## Target

- `Modal(props: ModalProps): ReactElement | null`
- `ModalProps`: `{ open: boolean; onClose: () => void; title: string; children: ReactNode }`

## Interviewer follow-up

`aria-modal="true"` tells assistive tech the rest of the page is inert, but it
does not actually trap Tab focus. How would you implement a real focus trap
here, and what does the native `<dialog>` element give you for free that this
implementation has to hand-roll?

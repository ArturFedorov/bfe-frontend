# 003. Collapsible Panel

**Difficulty:** Easy
**Topics:** State, Conditional Rendering, Component Lifetime, aria-expanded

---

## Scenario

Delivery detail pages in the partner portal stack several collapsible panels —
"Encoding profile", "QC notes", "Delivery history" — so ops can hide what they
are not using. One panel contains a draft-notes textarea, and the team keeps
filing the same bug: collapsing the panel wipes the half-written note. The root
cause is the difference between conditionally rendering children (unmount —
state is destroyed) and hiding them with CSS (state survives). Build a panel
that supports both modes explicitly so callers choose the right trade-off.

## Acceptance Criteria

- Header is a real `<button>` showing `title`, with `aria-expanded` reflecting
  the open state and `aria-controls` pointing at the content container.
- Content container has `role="region"` with the panel title as its accessible
  name.
- Starts closed by default; `defaultOpen` opts into starting open. Clicking the
  header toggles.
- `mode="unmount"` (default): closed content is not in the DOM at all — child
  state is destroyed on collapse.
- `mode="hidden"`: closed content stays mounted but hidden (the `hidden`
  attribute) — child state survives collapse and reopen.
- Toggling works with keyboard out of the box (it is a native button).

## Example

```ts
<CollapsiblePanel title="Delivery history">
  <HistoryTable />
</CollapsiblePanel>

<CollapsiblePanel title="QC notes" mode="hidden" defaultOpen>
  <textarea aria-label="Notes" />
</CollapsiblePanel>
```

## Target

The caller can choose whether collapse destroys child state (unmount) or preserves it (CSS hiding) — and the component honors that choice exactly.

## Interviewer follow-up

The team asks for a third behavior: keep state across collapse but only mount
the content lazily on first open. How would you implement that?

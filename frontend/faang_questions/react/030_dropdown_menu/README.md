# 030. Dropdown Menu

**Difficulty:** Medium
**Topics:** Outside Click, Keyboard Navigation, ARIA Menu Pattern, Document Listeners

---

## Scenario

Every row in the deliveries table gets a "⋯ Actions" menu: Retry delivery,
View manifest, Archive — with Archive disabled while a delivery is in flight.
No positioning library, no headless-UI package: the interview is the mechanics.
The two classic bugs to avoid are the outside-click listener that never gets
removed, and arrow-key navigation that lands on disabled items.

## Acceptance Criteria

- Renders a trigger `<button>` (accessible name = `label` prop) with
  `aria-haspopup="menu"` and `aria-expanded` reflecting the open state.
- Open menu renders `role="menu"` (labelled by the trigger); each item is a
  `role="menuitem"`. Menu items are NOT in the Tab order (`tabIndex={-1}`) —
  focus moves programmatically.
- Clicking the trigger opens the menu and moves focus to the first enabled
  item; clicking it again closes the menu.
- ArrowDown/ArrowUp move focus to the next/previous item, wrapping at the
  ends and **skipping disabled items**.
- Disabled items render with `aria-disabled="true"`; clicking or pressing
  Enter on them does not select or close.
- Enter (or click) on an enabled item calls `onSelect(id)` and closes the menu.
- A pointer press outside the component closes the menu (document-level
  listener, removed on close/unmount); clicks inside it do not.
- Escape closes the menu and returns focus to the trigger button.

## Example

```tsx
<DropdownMenu
  label="Actions"
  items={[
    { id: 'retry', label: 'Retry delivery' },
    { id: 'manifest', label: 'View manifest' },
    { id: 'archive', label: 'Archive', disabled: true },
  ]}
  onSelect={(id) => runAction(id)}
/>
```

## Target

- `DropdownMenu(props: DropdownMenuProps): ReactElement`
- `DropdownMenuItem`: `{ id: string; label: string; disabled?: boolean }`
- `DropdownMenuProps`: `{ label: string; items: DropdownMenuItem[]; onSelect?: (id: string) => void }`

## Interviewer follow-up

Why listen for `pointerdown` on `document` instead of putting an `onBlur` on
the menu, and why must the outside-press check use a ref to the root node
rather than `event.target.closest('.menu')`? What breaks when the menu itself
is portaled?

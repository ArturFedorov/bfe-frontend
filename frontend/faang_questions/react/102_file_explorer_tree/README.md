# 102. File Explorer Tree

**Difficulty:** Medium
**Estimated time:** 35 min
**Topics:** WAI-ARIA tree pattern, roving tabindex, tri-state checkboxes, derived state, controlled selection, pure helpers

---

## Scenario

The media-operations console lets an editor pick which assets go into an
export bundle. Assets live in nested folders (`Media / Promos / promo_a.mp4`).
The first version rendered a flat list of checkboxes with indentation done by
`&nbsp;` — screen readers announced 40 unrelated checkboxes, there was no way
to pick a whole folder, and every checkbox was a tab stop. Ops asked for a real
tree: pick a folder to pick everything inside it, see at a glance when a folder
is only partly selected, and drive the whole thing from the keyboard.

Build `<FileTree>`: a WAI-ARIA tree where every node has a checkbox, folders
cascade down and derive their state up, and selection is stored as **leaf ids
only** so the parent can hand it straight to the export API.

## Contract

```tsx
// file_tree.tsx
export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[]; // present (even empty) => folder; absent => leaf
}

<FileTree
  nodes={TreeNode[]}
  value={Set<string>}              // selected LEAF ids — folders are never in here
  onChange={(next: Set<string>) => void}
  defaultExpanded?={string[]}      // folder ids expanded on mount (default: none)
/>

leafIds(node: TreeNode): string[]
// every leaf id under `node` in document order; a leaf returns [its own id];
// a folder with no leaves returns []

folderState(node: TreeNode, selected: Set<string>): 'none' | 'some' | 'all'
// 'all' when every leaf under node is selected, 'none' when none is (also for
// a folder with zero leaves), 'some' otherwise; a leaf is 'all' or 'none'
```

### DOM shape (the tests query exactly this)

- Root: `role="tree"` with `aria-label="Files"`.
- Each node: `role="treeitem"` with `aria-level` (root nodes are level 1),
  `aria-labelledby` pointing at the node-name element, `aria-checked`
  (`"true"` / `"false"` / `"mixed"`), and `tabIndex` `0` on the current
  item and `-1` on every other item (roving tabindex). Folders additionally
  carry `aria-expanded`; leaves must **not** have `aria-expanded`.
- A folder's children render inside a `role="group"` under its treeitem and are
  **not rendered at all** while the folder is collapsed.
- Each node contains one `<input type="checkbox">` whose accessible name is the
  node name (`aria-label={name}` or `aria-labelledby`). A folder in `'some'`
  state has the DOM property `indeterminate === true` (set via a ref callback),
  and `checked` when `'all'`.
- Clicking a folder's **name** toggles its expansion (mouse affordance).

## Requirements

1. **Roles and structure.** `tree` labelled `Files`; a `treeitem` per node with
   `aria-level`; `aria-expanded` on folders only; collapsed folders render no
   children. Nodes listed in `defaultExpanded` start expanded.
2. **Cascade down.** Checking a folder's checkbox calls `onChange` with a new
   `Set` that adds **every** leaf under it; unchecking removes them. Checking a
   `'some'` folder selects all of it. `onChange` never receives folder ids.
3. **Derive up.** A folder whose leaves are partially selected shows
   `indeterminate` on its checkbox and `aria-checked="mixed"` on its treeitem;
   fully selected → `checked` + `"true"`; none → `"false"`. The derivation goes
   all the way up: one leaf deep inside makes every ancestor `"mixed"`.
4. **Controlled.** The component never stores selection; it renders from
   `value` and reports intent through `onChange(next)`. If the parent ignores
   the call, nothing changes.
5. **Keyboard (WAI-ARIA tree).** With focus on a treeitem:
   `ArrowDown` / `ArrowUp` move focus to the next / previous **visible** item
   (no wrap); `ArrowRight` expands a collapsed folder, or moves focus to the
   first child when already expanded, and does nothing on a leaf; `ArrowLeft`
   collapses an expanded folder, otherwise moves focus to the parent (nothing
   on a collapsed root); `Home` / `End` focus the first / last visible item;
   `Space` toggles the focused item's checkbox (same cascade as a click);
   `Enter` toggles expansion of a folder. `preventDefault` on handled keys.
   Moving focus also moves the roving `tabIndex`.
6. **Pure helpers.** `leafIds` and `folderState` are exported and side-effect
   free; the component uses them.

## Acceptance Criteria

- [ ] `leafIds` returns leaf ids in document order; a leaf returns itself; an
      empty folder returns `[]`.
- [ ] `folderState` returns `'none'` / `'some'` / `'all'` for a folder, `'none'`
      for an empty folder, and `'all'` / `'none'` for a leaf.
- [ ] `tree` named `Files`; every node is a `treeitem` with the right
      `aria-level`; folders have `aria-expanded`, leaves do not.
- [ ] Children of a collapsed folder are not in the DOM; `defaultExpanded`
      folders start open; clicking a folder name toggles it.
- [ ] Checking a folder calls `onChange` once with a `Set` containing exactly
      the previous selection plus all leaves under it; unchecking removes them.
- [ ] `onChange` payloads never contain a folder id.
- [ ] Partially selected folder: checkbox `toBePartiallyChecked()`, treeitem
      `aria-checked="mixed"`; fully selected: checkbox checked and `"true"`.
- [ ] Senior: a single selected leaf three levels deep makes **both** its
      parent and grandparent `mixed`, while a sibling folder stays `"false"`.
- [ ] Controlled: with an `onChange` that does nothing, clicking a checkbox
      leaves the DOM unchanged; when the parent updates `value`, the UI follows.
- [ ] `ArrowDown` / `ArrowUp` walk visible items in order, stopping at the
      ends; `Home` / `End` jump; the focused item is the only one with
      `tabindex="0"`.
- [ ] `ArrowRight` on a collapsed folder expands it (focus stays); a second
      `ArrowRight` focuses its first child; `ArrowLeft` on that child focuses
      the folder; another `ArrowLeft` collapses it.
- [ ] `Space` toggles the focused item's checkbox through `onChange`; `Enter`
      toggles expansion.
- [ ] Senior: after collapsing a folder, `ArrowDown` from it lands on the next
      **sibling**, not on a child that is no longer visible.

## Baseline a11y

- WAI-ARIA tree pattern: `tree` (labelled) → `treeitem` (`aria-level`,
  `aria-expanded` on folders, `aria-checked`) → `group` for children.
- Exactly one tab stop for the whole tree (roving tabindex).
- Checkboxes are real `<input type="checkbox">`s with a name, so the tri-state
  is exposed natively (`indeterminate`) and clickable with a mouse.

## Constraints

- React only; no tree/select libraries.
- Selection is **controlled** — no internal copy of `value`. Expansion and the
  focused item are internal state.
- Do not render collapsed children with `hidden` — do not render them at all.
- Keyboard handling must work on the `treeitem` elements, not on the
  checkbox inputs.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The tree grows to 20k nodes. Where does the current design go quadratic, and
  what would you memoise or precompute (parent map, leaf counts per folder)?
- Product wants folders to be selectable **on their own** (export the folder
  shell even when empty). What changes in the value shape and in `folderState`?
- Lazy-loaded children: a folder knows it has children but they arrive on
  expand. How do `aria-expanded`, `aria-busy` and the cascade behave while
  loading?
- Type-ahead: typing `pr` should focus `Promos`. Where does the buffer live and
  how do you reset it?

## Say out loud

- State shape first: `expanded: Set<string>` and `focusedId: string | null`
  are internal; selection is **only** `props.value`. Folder states are derived
  at render from `folderState(node, value)` — never stored.
- Name the hazard: focus restoration after re-render. Moving focus by key must
  set `focusedId` **and** call `.focus()` on the new element after React
  commits — a ref map or `querySelector('[data-id]')` inside an effect.
- Ask one data-shape question: can two nodes share an `id`? (Decide: no; the
  `Set` and the ref map both need unique ids.)
- Ask one failure-handling question: what happens when `value` contains a
  folder id or an unknown id — ignore silently, or warn in dev?
- Name the first test you would write: "checking `Promos` calls `onChange`
  with both promo leaves and nothing else".

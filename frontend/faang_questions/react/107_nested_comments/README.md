# 107. Nested Comments

**Difficulty:** Medium
**Estimated time:** 35 min
**Topics:** Flat list → tree (`buildThread`), recursive rendering with `aria-level`, optimistic UI with id swap and rollback, collapse state as a `Set`, depth limit with flattening

---

## Scenario

Reviewers in the media-operations console discuss QC findings under each
asset. The API returns comments as a flat list with `parentId`; the old UI
rendered them in arrival order, so replies appeared above the comment they
answered, deleted parents made their replies disappear, and every reply round-
tripped to the server before showing up — reviewers double-posted because
nothing happened for a second.

Build `<CommentThread>`: a nested, keyboard-reachable thread where posting is
optimistic (the reply appears at once, then takes the server's id, or is
removed with an alert on failure), subtrees collapse, and deep chains stop
indenting at level 4.

## Contract

```ts
interface Comment { id: string; parentId: string | null; author: string; text: string; createdAt: string }
interface ThreadNode extends Comment { children: ThreadNode[] }
const MAX_DEPTH = 4;

buildThread(comments): ThreadNode[]
// roots + children sorted by createdAt asc at every level;
// a comment whose parentId points at a missing comment becomes a root

countDescendants(node): number   // size of the subtree below `node`

<CommentThread
  comments={Comment[]}
  onReply={(parentId: string, text: string) => Promise<Comment>}  // resolves with the server copy
  currentUser="Artur"                                             // author of optimistic replies
/>
```

### DOM shape (the tests query exactly this)

- Root `role="list"`; each comment is a `role="listitem"` carrying
  `aria-level` (1-based), `data-comment-id="<id>"` and, while optimistic,
  `data-pending="true"`. A comment's replies render in a nested `role="list"`
  **inside** its `<li>`.
- Each comment shows its author and text, and a `Reply` button. Comments with
  children also have a `Collapse` / `Expand` button with `aria-expanded`;
  when collapsed, the text `N replies hidden` (`1 reply hidden` for one) is
  shown next to it.
- The reply form is a `<textarea>` with `aria-label="Reply to <author>"`, a
  `Post` button (disabled while the text is blank) and a `Cancel` button. Only
  one reply form is open at a time.
- Failures render a `role="alert"` element.
- At level 4, a comment's descendants are **not** nested: they render as
  following siblings in the same list, each with `aria-level="4"`, preceded
  by a listitem reading `Continue this thread`.

## Requirements

1. **Pure `buildThread`.** Flat list → forest; sort each sibling list by
   `createdAt` ascending; orphans become roots; never mutate the input.
   `countDescendants` counts the full subtree.
2. **Nested rendering.** Recursive lists with `aria-level`; siblings in
   `createdAt` order regardless of input order.
3. **Reply form.** `Reply` opens the form for that comment (closing any
   other); `Cancel` closes it; `Post` is disabled for blank text and otherwise
   calls `onReply(parentId, trimmedText)` and closes the form.
4. **Optimistic posting.** On `Post`, immediately render the reply under its
   parent with a temporary id, `author = currentUser`, `createdAt = now`, and
   `data-pending="true"`. When the promise resolves, replace the temporary
   comment with the server one (`data-comment-id` becomes the server id,
   `data-pending` is removed). When it rejects, remove the optimistic comment
   and show a `role="alert"`. If the parent later passes the server comment in
   `comments`, it must not appear twice (dedupe by id; props win).
5. **Collapse / expand.** Per comment with children; collapsing hides its
   whole subtree and shows `N replies hidden`; `aria-expanded` reflects the
   state. Leaves have no toggle.
6. **Maximum depth 4.** Levels 1–4 nest normally. Descendants of a level-4
   comment are flattened (pre-order) as siblings at level 4 behind a
   `Continue this thread` marker; collapsing that level-4 comment hides the
   flattened tail and the marker too. Flattened items show no toggle.

## Acceptance Criteria

- [ ] `buildThread` returns roots `[r1, r2]` with `r1.children = [r1a, r1b]`
      and `r1a.children = [r1a1]` from an out-of-order input; the input array
      is unchanged.
- [ ] Senior: an orphan with a missing parent is a root, sorted among roots.
- [ ] `countDescendants` returns 3 / 1 / 0 for the fixture.
- [ ] `aria-level` is 1 / 2 / 3 for root / reply / nested reply; the nested
      reply's `<li>` is inside the root's `<li>`; siblings follow `createdAt`.
- [ ] `Reply` shows `Reply to Priya`, `Post` disabled while empty, `Cancel`
      removes the form.
- [ ] `Post` calls `onReply('r2', 'Looks good')` and closes the form.
- [ ] The optimistic reply appears at once with `data-pending="true"`, level 2,
      author `currentUser`; after resolve, `data-pending` is gone,
      `data-comment-id` is the server id, and the text appears exactly once.
- [ ] Senior: on reject the optimistic reply disappears, a `role="alert"`
      appears, and the listitem count is back to the original.
- [ ] Re-rendering with the server comment also in `comments` shows it once.
- [ ] `Collapse` hides the subtree and shows `3 replies hidden`
      (`aria-expanded="false"`); `Expand` brings it back; a single hidden
      reply reads `1 reply hidden`; leaves have no toggle.
- [ ] Senior: a 6-deep chain renders `Depth 4/5/6` all at `aria-level="4"`,
      max level on the page is 4, `Continue this thread` sits between
      `Depth 4` and `Depth 5` in the same list.
- [ ] Collapsing `Depth 4` hides `Depth 5`, `Depth 6` and the marker, and reads
      `2 replies hidden`.

## Baseline a11y

- Real nested lists (`list` / `listitem`) plus `aria-level` so screen readers
  announce depth; indentation is CSS from `--level`, not nested margins hard-
  coded per level.
- The reply textarea has an explicit label naming who is being answered; the
  buttons are real `<button>`s.
- Failures use `role="alert"` (assertive) because the user's text vanished;
  everything else stays quiet.
- Collapse buttons carry `aria-expanded`.

## Constraints

- React only; no comment/thread library.
- `buildThread` runs on every render from the merged list — do not keep a
  tree in state.
- Optimistic replies and confirmed server replies are local state layered
  over `props.comments`; never mutate the props array.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- The thread has 5k comments and re-sorting on every keystroke in the reply box
  is visible. What do you memoise, and what key invalidates it?
- Replies can be edited and deleted. How does a soft-deleted parent render,
  and what changes in `buildThread` for a "[deleted]" placeholder vs orphaning?
- Two optimistic replies are in flight and the first fails. How do you keep
  the second's position stable and tell the user which one failed?

## Say out loud

- State shape first: `pending[]` (optimistic, with temp ids), `confirmed[]`
  (server copies), `collapsed: Set<id>`, `replyingTo: id | null`; the tree is
  derived from `props.comments ∪ confirmed ∪ pending` with props winning on
  duplicate ids.
- Name the hazard: the id swap — React keys change from the temp id to the
  server id, so the `<li>` remounts; make sure no local state (an open reply
  box) lives on the optimistic item.
- Ask one data-shape question: can `createdAt` collide? (Decide: yes; fall
  back to id order so the sort is stable across renders.)
- Ask one failure-handling question: should a failed reply re-open the form
  with the text pre-filled? (Decide: out of scope here — alert only — but
  name it as the real UX.)
- Name the first test you would write: "rejecting the reply removes the
  optimistic comment and shows an alert".

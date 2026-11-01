# 043. List Key Bugs

Difficulty: Medium
Topics: keys, reconciliation, DOM state ownership, uncontrolled inputs

## Scenario

The content-ops queue lets an operator reorder titles and jot a note on each row. Bug report: "I typed a note on Alpha, moved it down, and my note is now on Bravo." The note lives in an uncontrolled `<input>` — the DOM node owns it — and the list is keyed by array **index**. When rows swap, React sees the same keys `0, 1, 2` in the same positions, so it keeps every DOM node where it is and just repaints the labels around them. The note stays at the old slot while the title moves.

This is a **fix-the-code** task (`// TODO: fix the performance problem below` in `list_key_bugs.tsx`). The fix is tiny; the interview value is the explanation: what React compares during reconciliation, why `key` is the identity signal, and which kinds of state get corrupted (DOM state, `useState` in the row, CSS transitions, focus).

### Render-count convention

Components accept `onRender?: (id: string) => void` and call it at the top of the body (`'list'`, `'row-t-alpha'`, …). Tests in this topic use it as a probe; this task's failures are behavioral, but the convention still applies.

## Acceptance Criteria

- Order behavior unchanged: initial order Alpha/Bravo/Charlie, "Move X down" swaps X with its successor, moving the last row is a no-op.
- After typing a note on Alpha and moving Alpha down, the note is still on Alpha's row and Bravo's note field is empty.
- Notes on multiple rows survive multiple reorders without swapping owners.
- Keys are stable, unique per item identity, and derived from data — not from render position.

## Example

```tsx
await user.type(screen.getByLabelText('Note for Alpha'), 'audio drops at 12:03');
await user.click(screen.getByRole('button', { name: 'Move Alpha down' }));
// after the fix:
expect(screen.getByLabelText('Note for Alpha')).toHaveValue('audio drops at 12:03');
expect(screen.getByLabelText('Note for Bravo')).toHaveValue('');
```

## Target

Complexity budget: the fix itself is O(1) — one attribute. Reconciliation budget: a swap of two rows must MOVE two existing DOM subtrees (React matches them by key), not rewrite the props/attributes of every row in place while stranding their DOM state. No remounts of unaffected rows: Charlie's input must keep its DOM node identity through the swap.

## Interviewer follow-up

- Explain the exact reconciliation steps with index keys vs id keys when `[A, B, C]` becomes `[B, A, C]`. Which fibers/DOM nodes are reused for which items in each case?
- The row input is uncontrolled here. Would a controlled input (`value` from row-local `useState` inside `Row`) have hidden the bug or shown the same corruption? Why?
- When IS index-as-key acceptable? Name the conditions that must ALL hold.
- What breaks if you "fix" it with `key={Math.random()}` — what does the UI do on every reorder, and what state is lost?

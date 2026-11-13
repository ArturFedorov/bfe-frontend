# 110. Connect Four

**Difficulty:** Medium
**Estimated time:** 35–45 min
**Topics:** immutable game state, derived state, O(1) win detection from the last move, undo stack, `role="grid"` keyboard model, `aria-live` discipline

---

## Scenario

The design-system team uses a Connect Four board as its "UI state" take-home:
two players, a 6×7 grid with gravity, win detection, undo. The last candidate
kept `cells`, `currentPlayer`, `winner` and `winningCells` as four separate
`useState`s and re-scanned the whole board after every move; undo forgot to
clear the winner, so the game stayed frozen after taking a move back.

Build the pure game model first (testable without React), then a small
accessible component on top of it. Win detection must look only at the four
lines through the **last** move.

## Contract

```ts
type Cell = 0 | 1 | 2;                 // 0 empty, 1 / 2 the player's token
type Player = 1 | 2;
type Winner = 0 | Player | 'draw';     // 0 while running
type Coord = [row: number, col: number];

interface Board {
  cells: Cell[][];      // cells[row][col]; row 0 is the TOP row
  current: Player;      // whose turn it is; 1 on a fresh board
  winner: Winner;
  history: number[];    // column of every drop, oldest first (the undo stack)
}

createBoard(rows = 6, cols = 7): Board
drop(board, col): Board           // gravity; full column, bad col or finished game → same reference
undo(board): Board                // pops the last drop; empty history → same reference
checkWinner(cells, row, col): Player | 0   // scans ONLY the 4 lines through (row, col)
winningCells(cells): Coord[] | null        // full scan; the cells of the first run of ≥ 4

<ConnectFour rows? cols? />       // defaults 6 × 7
```

### DOM shape (the tests query exactly this)

- `<div role="grid" aria-label="Connect Four" tabIndex={0}>` — the keyboard
  handler lives here.
- First `role="row"`: one `<button role="columnheader" aria-label="Drop in column N">`
  per column (`N` is 1-based), `aria-selected="true"` on the cursor column,
  `disabled` when the column is full **or** the game is finished.
- One `role="row"` per board row with a `role="gridcell"` per square:
  `aria-label="Row r, column c: empty | Player 1 | Player 2"` (1-based,
  row 1 at the top, so a fresh drop lands in `Row 6`). Cells of the winning
  run carry a `data-winning` attribute; nothing else does.
- `role="status"` reads `Player N's turn`, `Player N wins!` or `Draw`.
- A `Player N` label (exact text, mirrors `board.current`) with
  `aria-live="off"` — the status region does the announcing.
- Buttons `Undo` (disabled when `history` is empty) and `New game`.

## Requirements

1. **Pure board.** `createBoard` returns an all-zero grid, `current: 1`,
   `winner: 0`, `history: []`. `drop` never mutates its input.
2. **Gravity.** `drop(board, col)` places `board.current` in the lowest empty
   row of `col` (highest row index), appends `col` to `history`, toggles
   `current`. A full column, an out-of-range column, or a finished game
   returns the **same reference**.
3. **Win detection from the last move.** After placing, call
   `checkWinner(cells, row, col)`: walk both ways along horizontal, vertical
   and the two diagonals from the placed cell; a run of ≥ 4 wins. Cost is
   independent of board size. A full board with no winner → `winner: 'draw'`.
4. **`winningCells`** scans the board and returns every cell of the first
   run of ≥ 4 found (null otherwise). The component uses it for
   `data-winning`. (Alternative: remember the winning line in `Board`; the
   signature above is what the tests import.)
5. **Undo.** `undo` removes the topmost token of the last dropped column,
   sets `current` to the player who made that move, resets `winner` to `0`,
   and pops `history`. Empty history → same reference.
6. **Component.** `useState<Board>` plus a column cursor. Header click drops
   into that column **and** moves the cursor there. Status, labels and
   `data-winning` are derived from the board every render — no mirrored
   state.
7. **Keyboard.** With the grid focused: `ArrowLeft` / `ArrowRight` move the
   cursor (clamped, no wrap); `Enter` / `Space` drop into the cursor column
   (prevent default so Space does not scroll). A focused header button drops
   through its native click — do not double-drop.
8. **Undo / New game.** `Undo` is disabled on an empty history; after a win,
   `Undo` re-enables the headers and clears `data-winning`. `New game`
   resets board and cursor.

## Acceptance Criteria

- [ ] `createBoard()` → 6×7 zeros, `current 1`, `winner 0`, `history []`;
      custom dimensions honoured.
- [ ] `drop` lands on the bottom row, then stacks; toggles `current`; appends
      to `history`; does not mutate the input.
- [ ] Full column, out-of-range column and finished game → same reference.
- [ ] 2×2 board filled without a winner → `'draw'`.
- [ ] `checkWinner`: 0 on empty cell / no run; horizontal from either end or
      the middle; vertical; both diagonals; no match across a gap.
- [ ] `winningCells`: null without a win; exactly the four coordinates of a
      horizontal win; the diagonal four after a diagonal game.
- [ ] `undo`: same reference on empty history; removes the topmost token of
      the last column; hands the turn back; clears a win.
- [ ] Grid labelled `Connect Four`, 7 header buttons, 42 labelled cells,
      status `Player 1's turn`; `rows` / `cols` props respected.
- [ ] `Player 1` label has `aria-live="off"`.
- [ ] Click header 3 → `Row 6, column 3: Player 1`, status `Player 2's turn`;
      second click → `Row 5, column 3: Player 2`.
- [ ] Full column disables its header only.
- [ ] Horizontal win → `Player 1 wins!`, exactly 4 `data-winning` cells, all
      headers disabled.
- [ ] Senior: diagonal win played through the UI marks `(6,1) (5,2) (4,3) (3,4)`.
- [ ] Draw via UI on a 2×2 board → status `Draw`, no `data-winning`.
- [ ] `Undo` disabled on empty board; removes the last token; disabled again.
- [ ] Senior: `Undo` after a win → `Player 1's turn`, no `data-winning`,
      headers enabled, the next drop works.
- [ ] `New game` → all cells empty, status reset, `Undo` disabled.
- [ ] Keyboard: cursor starts at column 1, clamps left, moves right, clamps
      at column 7; `Enter` then `Space` drop into the cursor column.
- [ ] Clicking a header moves the cursor (`aria-selected`) to it.

## Baseline a11y

- `role="grid"` → `row` → `columnheader` / `gridcell`; every cell has a
  readable name that includes its owner.
- Exactly one live region (`role="status"`); the player label opts out with
  `aria-live="off"` so two regions never announce the same turn.
- Header buttons are real `<button>`s: disabled state and Enter/Space come
  for free; the grid's `tabIndex={0}` gives keyboard users one tab stop.

## Constraints

- React only; no game or state library.
- Board updates are immutable (new `cells` array for the changed row).
- Win detection after a move must not scan the full board.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- Add **redo**: what does the history become, and what invalidates the redo
  stack?
- The board becomes 100×100: which parts of your render are now too slow, and
  what would you memoise or virtualise first?
- Two players on different machines: where does the board live, what is
  the wire format for a move, and how do you reject an out-of-turn drop?

## Say out loud

- State shape first: one `Board` object in `useState`, cursor separately;
  everything else (status text, labels, `data-winning`) is derived.
- Name the invariant: `current` is determined by `history.length` parity —
  say it, then keep the field anyway because the contract asks for it.
- Name the performance point: `checkWinner` from the last move is O(1); the
  full scan in `winningCells` runs only once a game is finished.
- Ask one UX question: should the column cursor wrap around at the edges?
  (Here: clamp.)
- Name the first test you would write: "drop lands in the bottom row and
  the next drop in the same column lands on top of it".

/**
 * Reference solution for 110 — keep connect_four.tsx blank for redo practice;
 * this file is for comparison after your own attempt.
 *
 * State shape (say it out loud first): ONE immutable `Board` in `useState` plus
 * a column cursor. Status text, cell labels and `data-winning` are all derived
 * on render — nothing is mirrored. `current` is really `history.length`
 * parity, but the contract asks for the field so it is kept in sync.
 *
 * Win detection after a move walks only the four lines through the placed
 * cell (`checkWinner`, O(1) in board size); the full scan (`winningCells`)
 * runs only once a game is won, to highlight the run.
 */
import { useMemo, useState, type KeyboardEvent, type ReactElement } from 'react';

/** 0 = empty, 1 / 2 = the player's token. */
export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Winner = 0 | Player | 'draw';
/** `[row, col]`, zero-based. Row 0 is the TOP row; gravity fills from `rows - 1` upwards. */
export type Coord = [row: number, col: number];

export interface Board {
  cells: Cell[][];
  /** Whose turn it is (always `1` on an empty board). */
  current: Player;
  /** `0` while the game is running. */
  winner: Winner;
  /** Column index of every drop so far, oldest first — the undo stack. */
  history: number[];
}

export interface ConnectFourProps {
  /** Default 6. */
  rows?: number;
  /** Default 7. */
  cols?: number;
}

// ---------------------------------------------------------------------------
// Pure game model
// ---------------------------------------------------------------------------

const WIN_LENGTH = 4;

/** One representative per line: horizontal, vertical, falling and rising diagonal. */
const DIRECTIONS: ReadonlyArray<readonly [dr: number, dc: number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const other = (p: Player): Player => (p === 1 ? 2 : 1);

export function createBoard(rows = 6, cols = 7): Board {
  return {
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => 0)),
    current: 1,
    winner: 0,
    history: [],
  };
}

/** Lowest empty row of `col`, or -1 when the column is full. */
function landingRow(cells: Cell[][], col: number): number {
  for (let r = cells.length - 1; r >= 0; r--) if (cells[r][col] === 0) return r;
  return -1;
}

/** Count same-player cells from (row, col) walking in one direction, excluding the origin. */
function runLength(cells: Cell[][], row: number, col: number, dr: number, dc: number, player: Cell): number {
  let n = 0;
  let r = row + dr;
  let c = col + dc;
  while (r >= 0 && r < cells.length && c >= 0 && c < cells[r].length && cells[r][c] === player) {
    n++;
    r += dr;
    c += dc;
  }
  return n;
}

/** Scans only the four lines through (row, col) — O(1) per move. */
export function checkWinner(cells: Cell[][], row: number, col: number): Player | 0 {
  const player = cells[row]?.[col];
  if (!player) return 0;
  for (const [dr, dc] of DIRECTIONS) {
    // Both ways along the line plus the placed cell itself.
    const total = 1 + runLength(cells, row, col, dr, dc, player) + runLength(cells, row, col, -dr, -dc, player);
    if (total >= WIN_LENGTH) return player;
  }
  return 0;
}

/** Full-board scan; every cell of the first run of ≥ 4, or null. */
export function winningCells(cells: Cell[][]): Coord[] | null {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const player = cells[r][c];
      if (!player) continue;
      for (const [dr, dc] of DIRECTIONS) {
        // Only report a run from its first cell so the result is the whole run, once.
        if (runLength(cells, r, c, -dr, -dc, player) > 0) continue;
        const ahead = runLength(cells, r, c, dr, dc, player);
        if (ahead + 1 >= WIN_LENGTH) {
          return Array.from({ length: ahead + 1 }, (_, i): Coord => [r + dr * i, c + dc * i]);
        }
      }
    }
  }
  return null;
}

/** Gravity drop for `board.current`. Full column, bad column or finished game → same reference. */
export function drop(board: Board, col: number): Board {
  if (board.winner !== 0) return board;
  if (!Number.isInteger(col) || col < 0 || col >= (board.cells[0]?.length ?? 0)) return board;
  const row = landingRow(board.cells, col);
  if (row < 0) return board;

  // Copy only the changed row; untouched rows keep their identity.
  const cells = board.cells.map((line, r) => (r === row ? line.map((cell, c) => (c === col ? board.current : cell)) : line));
  const history = [...board.history, col];
  const won = checkWinner(cells, row, col);
  const full = history.length === cells.length * (cells[0]?.length ?? 0);
  const winner: Winner = won !== 0 ? won : full ? 'draw' : 0;

  return { cells, current: other(board.current), winner, history };
}

/** Pops the last drop and hands the turn back; empty history → same reference. */
export function undo(board: Board): Board {
  if (board.history.length === 0) return board;
  const col = board.history[board.history.length - 1];
  // The topmost token in that column is the one placed last.
  const row = board.cells.findIndex((line) => line[col] !== 0);
  if (row < 0) return board; // inconsistent history — nothing to remove
  const mover = board.cells[row][col] as Player;

  const cells = board.cells.map((line, r) => (r === row ? line.map((cell, c) => (c === col ? 0 : cell)) : line));
  return { cells, current: mover, winner: 0, history: board.history.slice(0, -1) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const cellName = (cell: Cell): string => (cell === 0 ? 'empty' : `Player ${cell}`);

export function ConnectFour({ rows = 6, cols = 7 }: ConnectFourProps): ReactElement {
  const [board, setBoard] = useState<Board>(() => createBoard(rows, cols));
  const [cursor, setCursor] = useState(0);

  const finished = board.winner !== 0;
  // Full scan only once somebody has won — never during play.
  const winning = useMemo(
    () => (board.winner === 1 || board.winner === 2 ? winningCells(board.cells) : null),
    [board.cells, board.winner],
  );
  const winningKeys = useMemo(() => new Set(winning?.map(([r, c]) => `${r}:${c}`)), [winning]);

  const status =
    board.winner === 'draw' ? 'Draw' : board.winner !== 0 ? `Player ${board.winner} wins!` : `Player ${board.current}'s turn`;

  const play = (col: number): void => {
    setCursor(col);
    setBoard((b) => drop(b, col));
  };

  const reset = (): void => {
    setBoard(createBoard(rows, cols));
    setCursor(0);
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setCursor((c) => Math.min(cols - 1, c + 1));
        break;
      case 'Enter':
      case ' ':
        // A focused header button drops through its own native click — don't double-drop.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        play(cursor);
        break;
      default:
    }
  };

  return (
    <div className="connect-four">
      <p role="status" className="c4-status">
        {status}
      </p>
      <p className="c4-player" aria-live="off">
        Player {board.current}
      </p>

      <div role="grid" aria-label="Connect Four" tabIndex={0} className="c4-grid" onKeyDown={onGridKeyDown}>
        <div role="row" className="c4-headers">
          {Array.from({ length: cols }, (_, c) => (
            <button
              key={c}
              type="button"
              role="columnheader"
              aria-label={`Drop in column ${c + 1}`}
              aria-selected={c === cursor}
              disabled={finished || board.cells[0][c] !== 0}
              onClick={() => play(c)}
            >
              ▼
            </button>
          ))}
        </div>

        {board.cells.map((line, r) => (
          <div key={r} role="row" className="c4-row">
            {line.map((cell, c) => (
              <div
                key={c}
                role="gridcell"
                className="c4-cell"
                aria-label={`Row ${r + 1}, column ${c + 1}: ${cellName(cell)}`}
                data-player={cell || undefined}
                data-winning={winningKeys.has(`${r}:${c}`) ? '' : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="c4-controls">
        <button type="button" onClick={() => setBoard((b) => undo(b))} disabled={board.history.length === 0}>
          Undo
        </button>
        <button type="button" onClick={reset}>
          New game
        </button>
      </div>
    </div>
  );
}

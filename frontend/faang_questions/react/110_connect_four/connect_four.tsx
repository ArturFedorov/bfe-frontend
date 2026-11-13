import type { ReactElement } from 'react';

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

export function createBoard(rows = 6, cols = 7): Board {
  throw new Error('Not implemented');
}

/** Gravity drop for `board.current`. Full column, bad column or finished game → same reference. */
export function drop(board: Board, col: number): Board {
  throw new Error('Not implemented');
}

/** Pops the last drop and hands the turn back; empty history → same reference. */
export function undo(board: Board): Board {
  throw new Error('Not implemented');
}

/** Scans only the four lines through (row, col) — O(1) per move. */
export function checkWinner(cells: Cell[][], row: number, col: number): Player | 0 {
  throw new Error('Not implemented');
}

/** Full-board scan; every cell of the first run of ≥ 4, or null. */
export function winningCells(cells: Cell[][]): Coord[] | null {
  throw new Error('Not implemented');
}

export function ConnectFour(props: ConnectFourProps): ReactElement {
  throw new Error('Not implemented');
}

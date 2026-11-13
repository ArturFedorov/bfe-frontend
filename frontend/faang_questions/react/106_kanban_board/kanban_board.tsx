import type { ReactElement } from 'react';

export interface Card {
  id: string;
  title: string;
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface Board {
  columns: Column[];
  cards: Record<string, Card>;
}

export interface KanbanBoardProps {
  value: Board;
  onChange: (next: Board) => void;
}

/**
 * Move `cardId` into `toColumnId` at `toIndex`.
 * `toIndex` is the position in the destination's `cardIds` AFTER the card has
 * been removed from its source (so a same-column move counts positions without
 * the card itself). It is clamped to `[0, length]`.
 * Returns the SAME `board` reference when nothing changes (unknown card /
 * column, or the card is already at that position). Untouched columns and the
 * `cards` map keep their identity.
 */
export function moveCard(board: Board, cardId: string, toColumnId: string, toIndex: number): Board {
  throw new Error('Not implemented');
}

/** Reorder within one column: the card at `from` ends up at `to` (same clamping and identity rules). */
export function reorderColumn(board: Board, columnId: string, from: number, to: number): Board {
  throw new Error('Not implemented');
}

export function KanbanBoard(props: KanbanBoardProps): ReactElement {
  throw new Error('Not implemented');
}

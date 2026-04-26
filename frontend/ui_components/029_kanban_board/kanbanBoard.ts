export interface KanbanCard {
  id: string;
  text: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanBoardOptions {
  container: HTMLElement;
  initialColumns: KanbanColumn[];
  onChange?: (state: KanbanColumn[]) => void;
}

export function createKanbanBoard(options: KanbanBoardOptions): {
  getState: () => KanbanColumn[];
  moveCard: (
    cardId: string,
    targetColumnId: string,
    targetIndex: number,
  ) => void;
  destroy: () => void;
} {
  return { getState: () => [], moveCard() {}, destroy() {} };
}

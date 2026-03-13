export interface SortableOptions {
  container: HTMLElement;
  items: string[];
  onReorder: (items: string[]) => void;
}

export function createSortable(options: SortableOptions): {
  getItems: () => string[];
  destroy: () => void;
} {
  return { getItems: () => [], destroy() {} };
}

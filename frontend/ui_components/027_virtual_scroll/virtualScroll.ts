export interface VirtualScrollOptions<T> {
  container: HTMLElement;
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => string | HTMLElement;
}

export function createVirtualScroll<T>(options: VirtualScrollOptions<T>): {
  setItems: (items: T[]) => void;
  scrollToIndex: (index: number) => void;
  getVisibleRange: () => { start: number; end: number };
  destroy: () => void;
} {
  return {
    setItems() {},
    scrollToIndex() {},
    getVisibleRange: () => ({ start: 0, end: 0 }),
    destroy() {},
  };
}

export interface InfiniteScrollOptions {
  container: HTMLElement;
  loadMore: () => Promise<HTMLElement[]>;
  threshold?: number;
}

export function createInfiniteScroll(options: InfiniteScrollOptions): {
  destroy: () => void;
} {
  return { destroy() {} };
}

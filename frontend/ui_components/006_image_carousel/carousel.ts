export interface CarouselOptions {
  container: HTMLElement;
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

export function createCarousel(options: CarouselOptions): {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  getCurrentIndex: () => number;
  destroy: () => void;
} {
  return {
    next() {},
    prev() {},
    goTo() {},
    getCurrentIndex: () => 0,
    destroy() {},
  };
}

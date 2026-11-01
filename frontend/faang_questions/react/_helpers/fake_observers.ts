/**
 * IntersectionObserver and ResizeObserver doubles for jsdom tests.
 * Install in beforeEach, restore in afterEach, trigger from the test.
 */
export class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  private targets = new Set<Element>();

  constructor(private callback: IntersectionObserverCallback, _init?: IntersectionObserverInit) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }
  unobserve(target: Element): void {
    this.targets.delete(target);
  }
  disconnect(): void {
    this.targets.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Is this element currently observed? */
  observes(target: Element): boolean {
    return this.targets.has(target);
  }

  /** Report `target` as intersecting (or not). */
  trigger(target: Element, isIntersecting: boolean): void {
    if (!this.targets.has(target)) return;
    const entry = {
      target,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry;
    this.callback([entry], this);
  }

  static reset(): void {
    FakeIntersectionObserver.instances = [];
  }
}

export class FakeResizeObserver implements ResizeObserver {
  static instances: FakeResizeObserver[] = [];
  private targets = new Set<Element>();

  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }
  unobserve(target: Element): void {
    this.targets.delete(target);
  }
  disconnect(): void {
    this.targets.clear();
  }
  observes(target: Element): boolean {
    return this.targets.has(target);
  }

  /** Report a new size for `target`. Also patches getBoundingClientRect/offsetHeight to match. */
  trigger(target: Element, size: { width?: number; height: number }): void {
    if (!this.targets.has(target)) return;
    const width = size.width ?? 0;
    setElementSize(target, width, size.height);
    const entry = {
      target,
      contentRect: { x: 0, y: 0, top: 0, left: 0, width, height: size.height, bottom: size.height, right: width },
      borderBoxSize: [{ inlineSize: width, blockSize: size.height }],
      contentBoxSize: [{ inlineSize: width, blockSize: size.height }],
      devicePixelContentBoxSize: [{ inlineSize: width, blockSize: size.height }],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this);
  }

  static reset(): void {
    FakeResizeObserver.instances = [];
  }
}

/** jsdom has no layout: fake an element's measured size. */
export function setElementSize(el: Element, width: number, height: number): void {
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height });
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: height });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width });
  (el as HTMLElement).getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, width, height, bottom: height, right: width, toJSON: () => ({}) }) as DOMRect;
}

const originals: Record<string, unknown> = {};

export function installFakeObservers(): void {
  const g = globalThis as Record<string, unknown>;
  originals.IntersectionObserver = g.IntersectionObserver;
  originals.ResizeObserver = g.ResizeObserver;
  g.IntersectionObserver = FakeIntersectionObserver;
  g.ResizeObserver = FakeResizeObserver;
  FakeIntersectionObserver.reset();
  FakeResizeObserver.reset();
}

export function restoreObservers(): void {
  const g = globalThis as Record<string, unknown>;
  g.IntersectionObserver = originals.IntersectionObserver;
  g.ResizeObserver = originals.ResizeObserver;
  FakeIntersectionObserver.reset();
  FakeResizeObserver.reset();
}

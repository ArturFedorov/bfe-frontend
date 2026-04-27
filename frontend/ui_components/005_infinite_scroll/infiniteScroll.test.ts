/**
 * @jest-environment jsdom
 */
import { createInfiniteScroll, InfiniteScrollOptions } from './infiniteScroll';

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  rootMargin: string;
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn(() => {
    this.disconnected = true;
  });
  takeRecords = jest.fn(() => []);
  root: Element | Document | null = null;
  thresholds: ReadonlyArray<number> = [];
  disconnected = false;

  constructor(
    cb: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = cb;
    this.rootMargin = options?.rootMargin ?? '';
    instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    if (this.disconnected) return;
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

let instances: MockIntersectionObserver[] = [];

beforeEach(() => {
  instances = [];
  (
    globalThis as unknown as { IntersectionObserver: unknown }
  ).IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  document.body.innerHTML = '';
});

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function createItems(count: number): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => {
    const el = document.createElement('div');
    el.textContent = `Item ${i}`;
    el.className = 'item';
    return el;
  });
}

function setup(overrides: Partial<InfiniteScrollOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const loadMore = jest
    .fn<Promise<HTMLElement[]>, []>()
    .mockResolvedValue(createItems(5));

  const options: InfiniteScrollOptions = {
    container,
    loadMore,
    threshold: 100,
    ...overrides,
  };
  const scroll = createInfiniteScroll(options);
  const observer = instances[instances.length - 1];
  const spinner = container.firstChild as HTMLElement;
  return { container, loadMore, scroll, observer, spinner };
}

describe('createInfiniteScroll', () => {
  test('loads initial batch on construction', async () => {
    const { loadMore } = setup();
    await flush();
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  test('calls loadMore when sentinel intersects', async () => {
    const { loadMore, observer } = setup();
    await flush();
    loadMore.mockClear();
    observer.trigger(true);
    await flush();
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  test('appends new elements to container', async () => {
    const { container } = setup();
    await flush();
    expect(container.querySelectorAll('.item').length).toBe(5);
  });

  test('shows loading indicator while loading and hides it after', async () => {
    let resolveLoad!: (items: HTMLElement[]) => void;
    const loadMore = jest.fn(
      () =>
        new Promise<HTMLElement[]>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const { spinner } = setup({ loadMore });
    expect(spinner.style.display).toBe('block');
    expect(spinner.textContent).toContain('Loading');
    resolveLoad(createItems(3));
    await flush();
    expect(spinner.style.display).toBe('none');
  });

  test('stops loading when loadMore returns empty array', async () => {
    const loadMore = jest
      .fn<Promise<HTMLElement[]>, []>()
      .mockResolvedValue([]);
    const { observer, spinner } = setup({ loadMore });
    await flush();
    expect(observer.disconnect).toHaveBeenCalled();
    expect(spinner.textContent).toContain('end');
    loadMore.mockClear();
    observer.trigger(true);
    await flush();
    expect(loadMore).not.toHaveBeenCalled();
  });

  test('threshold sets observer rootMargin', () => {
    const { observer } = setup({ threshold: 50 });
    expect(observer.rootMargin).toBe('50px');
  });

  test('destroy disconnects observer and prevents further loads', async () => {
    const { scroll, observer, loadMore } = setup();
    await flush();
    loadMore.mockClear();
    scroll.destroy();
    expect(observer.disconnect).toHaveBeenCalled();
    observer.trigger(true);
    await flush();
    expect(loadMore).not.toHaveBeenCalled();
  });

  test('does not call loadMore while already loading', async () => {
    let resolveLoad!: (items: HTMLElement[]) => void;
    const loadMore = jest.fn(
      () =>
        new Promise<HTMLElement[]>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const { observer } = setup({ loadMore });
    observer.trigger(true);
    observer.trigger(true);
    await flush();
    expect(loadMore).toHaveBeenCalledTimes(1);
    resolveLoad(createItems(1));
  });

  test('shows retry button on error and reloads on click', async () => {
    const loadMore = jest
      .fn<Promise<HTMLElement[]>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(createItems(2));
    const { container, spinner } = setup({ loadMore });
    await flush();
    const button = spinner.querySelector('button');
    expect(button).toBeTruthy();
    button!.click();
    await flush();
    expect(loadMore).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll('.item').length).toBe(2);
  });
});

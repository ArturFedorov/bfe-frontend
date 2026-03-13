/**
 * @jest-environment jsdom
 */
import { createInfiniteScroll, InfiniteScrollOptions } from './infiniteScroll';

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
  Object.defineProperty(container, 'clientHeight', { value: 500, writable: true });
  Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
  Object.defineProperty(container, 'scrollTop', { value: 0, writable: true });
  document.body.appendChild(container);

  const loadMore = jest.fn<Promise<HTMLElement[]>, []>().mockResolvedValue(createItems(5));

  const options: InfiniteScrollOptions = {
    container,
    loadMore,
    threshold: 100,
    ...overrides,
  };
  const scroll = createInfiniteScroll(options);
  return { container, loadMore, scroll };
}

function simulateScrollToBottom(container: HTMLElement) {
  Object.defineProperty(container, 'scrollTop', { value: 450, writable: true });
  container.dispatchEvent(new Event('scroll'));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createInfiniteScroll', () => {
  test('calls loadMore when scrolled near bottom', async () => {
    const { container, loadMore } = setup();
    simulateScrollToBottom(container);
    await Promise.resolve();
    expect(loadMore).toHaveBeenCalled();
  });

  test('appends new elements to container', async () => {
    const { container, loadMore } = setup();
    simulateScrollToBottom(container);
    await Promise.resolve();
    await loadMore.mock.results[0]?.value;
    const items = container.querySelectorAll('.item');
    expect(items.length).toBeGreaterThan(0);
  });

  test('shows loading indicator while loading', async () => {
    let resolveLoad!: (items: HTMLElement[]) => void;
    const loadMore = jest.fn(() => new Promise<HTMLElement[]>((resolve) => {
      resolveLoad = resolve;
    }));
    const { container } = setup({ loadMore });
    simulateScrollToBottom(container);
    await Promise.resolve();
    const loading = container.querySelector('[data-loading]');
    expect(loading).toBeTruthy();
    resolveLoad(createItems(3));
    await Promise.resolve();
  });

  test('stops loading when loadMore returns empty array', async () => {
    const loadMore = jest.fn<Promise<HTMLElement[]>, []>().mockResolvedValue([]);
    const { container } = setup({ loadMore });
    simulateScrollToBottom(container);
    await Promise.resolve();
    await loadMore.mock.results[0]?.value;
    loadMore.mockClear();
    simulateScrollToBottom(container);
    await Promise.resolve();
    expect(loadMore).not.toHaveBeenCalled();
  });

  test('threshold controls trigger point', async () => {
    const loadMore = jest.fn<Promise<HTMLElement[]>, []>().mockResolvedValue(createItems(2));
    const { container } = setup({ loadMore, threshold: 50 });
    Object.defineProperty(container, 'scrollTop', { value: 400, writable: true });
    container.dispatchEvent(new Event('scroll'));
    await Promise.resolve();
    expect(loadMore).not.toHaveBeenCalled();
    Object.defineProperty(container, 'scrollTop', { value: 460, writable: true });
    container.dispatchEvent(new Event('scroll'));
    await Promise.resolve();
    expect(loadMore).toHaveBeenCalled();
  });

  test('destroy removes scroll listener', async () => {
    const { container, loadMore, scroll } = setup();
    scroll.destroy();
    simulateScrollToBottom(container);
    await Promise.resolve();
    expect(loadMore).not.toHaveBeenCalled();
  });

  test('does not call loadMore while already loading', async () => {
    let resolveLoad!: (items: HTMLElement[]) => void;
    const loadMore = jest.fn(() => new Promise<HTMLElement[]>((resolve) => {
      resolveLoad = resolve;
    }));
    const { container } = setup({ loadMore });
    simulateScrollToBottom(container);
    await Promise.resolve();
    simulateScrollToBottom(container);
    await Promise.resolve();
    expect(loadMore).toHaveBeenCalledTimes(1);
    resolveLoad(createItems(1));
  });
});

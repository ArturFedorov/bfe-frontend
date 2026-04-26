/**
 * @jest-environment jsdom
 */
import { createVirtualScroll, VirtualScrollOptions } from './virtualScroll';

interface Row {
  id: number;
  text: string;
}

function makeItems(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, text: `Row ${i}` }));
}

function setup(overrides: Partial<VirtualScrollOptions<Row>> = {}) {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientHeight', {
    configurable: true,
    value: 300,
  });
  document.body.appendChild(container);
  const list = createVirtualScroll<Row>({
    container,
    items: makeItems(10000),
    itemHeight: 30,
    height: 300,
    renderItem: (item) => `<div data-id="${item.id}">${item.text}</div>`,
    ...overrides,
  });
  return { container, list };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createVirtualScroll', () => {
  test('renders only visible rows', () => {
    const { container } = setup();
    const rendered = container.querySelectorAll('[data-id]');
    expect(rendered.length).toBeLessThan(50);
  });

  test('inner spacer height matches total content', () => {
    const { container } = setup();
    const spacer = container.querySelector('[data-spacer]') as HTMLElement;
    expect(spacer.style.height).toBe(`${10000 * 30}px`);
  });

  test('getVisibleRange starts at 0 initially', () => {
    const { list } = setup();
    expect(list.getVisibleRange().start).toBe(0);
  });

  test('scrollToIndex updates scroll position', () => {
    const { container, list } = setup();
    list.scrollToIndex(100);
    expect(container.scrollTop).toBeGreaterThanOrEqual(100 * 30 - 30);
  });

  test('scroll updates visible range', () => {
    const { container, list } = setup();
    container.scrollTop = 1000;
    container.dispatchEvent(new Event('scroll'));
    const range = list.getVisibleRange();
    expect(range.start).toBeGreaterThan(20);
  });

  test('setItems updates the list', () => {
    const { container, list } = setup();
    list.setItems(makeItems(50));
    const spacer = container.querySelector('[data-spacer]') as HTMLElement;
    expect(spacer.style.height).toBe(`${50 * 30}px`);
  });

  test('rendered rows have correct top offset', () => {
    const { container } = setup();
    const first = container.querySelector('[data-id]') as HTMLElement;
    expect(first.style.position).toBe('absolute');
    expect(first.style.top).toBe('0px');
  });

  test('destroy clears DOM', () => {
    const { container, list } = setup();
    list.destroy();
    expect(container.children.length).toBe(0);
  });
});

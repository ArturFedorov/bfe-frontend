/**
 * @jest-environment jsdom
 */
import { createSortable, SortableOptions } from './sortable';

function setup(overrides: Partial<SortableOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onReorder = jest.fn();
  const options: SortableOptions = {
    container,
    items: ['Item 1', 'Item 2', 'Item 3'],
    onReorder,
    ...overrides,
  };
  const sortable = createSortable(options);
  return { container, onReorder, sortable };
}

function getItemElements(container: HTMLElement) {
  return container.querySelectorAll('[data-sortable-item]');
}

function simulateDragDrop(source: HTMLElement, target: HTMLElement) {
  const dataTransfer = {
    data: {} as Record<string, string>,
    setData(key: string, value: string) {
      this.data[key] = value;
    },
    getData(key: string) {
      return this.data[key] || '';
    },
    effectAllowed: 'move',
    dropEffect: 'move',
  };

  source.dispatchEvent(
    new DragEvent('dragstart', {
      bubbles: true,
      dataTransfer: dataTransfer as any,
    }),
  );
  target.dispatchEvent(
    new DragEvent('dragover', {
      bubbles: true,
      dataTransfer: dataTransfer as any,
    }),
  );
  target.dispatchEvent(
    new DragEvent('drop', { bubbles: true, dataTransfer: dataTransfer as any }),
  );
  source.dispatchEvent(
    new DragEvent('dragend', {
      bubbles: true,
      dataTransfer: dataTransfer as any,
    }),
  );
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createSortable', () => {
  test('renders items in container', () => {
    const { container } = setup();
    const items = getItemElements(container);
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe('Item 1');
    expect(items[1].textContent).toBe('Item 2');
    expect(items[2].textContent).toBe('Item 3');
  });

  test('items are draggable', () => {
    const { container } = setup();
    const items = getItemElements(container);
    items.forEach((item) => {
      expect((item as HTMLElement).getAttribute('draggable')).toBe('true');
    });
  });

  test('getItems returns current order', () => {
    const { sortable } = setup();
    expect(sortable.getItems()).toEqual(['Item 1', 'Item 2', 'Item 3']);
  });

  test('drag and drop changes order', () => {
    const { container, sortable } = setup();
    const items = getItemElements(container);
    simulateDragDrop(items[0] as HTMLElement, items[2] as HTMLElement);
    const newItems = sortable.getItems();
    expect(newItems[0]).not.toBe('Item 1');
  });

  test('onReorder called after drag', () => {
    const { container, onReorder } = setup();
    const items = getItemElements(container);
    simulateDragDrop(items[0] as HTMLElement, items[2] as HTMLElement);
    expect(onReorder).toHaveBeenCalled();
  });

  test('destroy cleans up', () => {
    const { container, sortable, onReorder } = setup();
    sortable.destroy();
    const items = getItemElements(container);
    if (items.length >= 2) {
      simulateDragDrop(items[0] as HTMLElement, items[1] as HTMLElement);
    }
    expect(onReorder).not.toHaveBeenCalled();
  });
});

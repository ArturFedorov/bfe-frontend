/**
 * @jest-environment jsdom
 */
import { createMessageList, Message, MessageListOptions } from './messageList';

function setup(overrides: Partial<MessageListOptions> = {}) {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientHeight', {
    configurable: true,
    value: 100,
  });
  document.body.appendChild(container);
  const list = createMessageList({ container, ...overrides });
  return { container, list };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createMessageList', () => {
  test('renders messages in seq order', () => {
    const { list } = setup();
    list.addMessages([
      { id: 'a', seq: 1, text: 'A' },
      { id: 'b', seq: 3, text: 'C' },
    ]);
    list.addMessages([{ id: 'c', seq: 2, text: 'B' }]);
    expect(list.getMessages().map((m) => m.text)).toEqual(['A', 'B', 'C']);
  });

  test('drops duplicates by id', () => {
    const { list } = setup();
    list.addMessages([{ id: 'a', seq: 1, text: 'A' }]);
    list.addMessages([{ id: 'a', seq: 1, text: 'A-dup' }]);
    expect(list.getMessages()).toHaveLength(1);
  });

  test('renders DOM nodes for each message', () => {
    const { container, list } = setup();
    list.addMessages([
      { id: 'a', seq: 1, text: 'Hello' },
      { id: 'b', seq: 2, text: 'World' },
    ]);
    expect(container.querySelectorAll('[data-id]').length).toBe(2);
  });

  test('auto-scrolls to bottom when user is at bottom', () => {
    const { container, list } = setup();
    Object.defineProperty(container, 'scrollHeight', {
      configurable: true,
      value: 100,
    });
    container.scrollTop = 0;
    list.addMessages([{ id: 'a', seq: 1, text: 'A' }]);
    Object.defineProperty(container, 'scrollHeight', {
      configurable: true,
      value: 200,
    });
    list.addMessages([{ id: 'b', seq: 2, text: 'B' }]);
    expect(container.scrollTop).toBeGreaterThan(0);
  });

  test('preserves scroll when user has scrolled up', () => {
    const { container, list } = setup();
    Object.defineProperty(container, 'scrollHeight', {
      configurable: true,
      value: 500,
    });
    container.scrollTop = 50;
    list.addMessages([{ id: 'a', seq: 1, text: 'A' }]);
    const before = container.scrollTop;
    list.addMessages([{ id: 'b', seq: 2, text: 'B' }]);
    expect(container.scrollTop).toBe(before);
  });

  test('destroy clears DOM', () => {
    const { container, list } = setup();
    list.addMessages([{ id: 'a', seq: 1, text: 'A' }]);
    list.destroy();
    expect(container.querySelectorAll('[data-id]').length).toBe(0);
  });
});

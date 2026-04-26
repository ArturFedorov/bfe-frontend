/**
 * @jest-environment jsdom
 */
import {
  createKanbanBoard,
  KanbanBoardOptions,
  KanbanColumn,
} from './kanbanBoard';

const INITIAL: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: 'c1', text: 'A' },
      { id: 'c2', text: 'B' },
    ],
  },
  { id: 'doing', title: 'In Progress', cards: [] },
  { id: 'done', title: 'Done', cards: [] },
];

function setup(overrides: Partial<KanbanBoardOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const board = createKanbanBoard({
    container,
    initialColumns: JSON.parse(JSON.stringify(INITIAL)),
    onChange,
    ...overrides,
  });
  return { container, board, onChange };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createKanbanBoard', () => {
  test('renders columns with their cards', () => {
    const { container } = setup();
    const cols = container.querySelectorAll('[data-column]');
    expect(cols.length).toBe(3);
    const todoCards = container.querySelectorAll(
      '[data-column="todo"] [data-card]',
    );
    expect(todoCards.length).toBe(2);
  });

  test('moveCard updates state', () => {
    const { board } = setup();
    board.moveCard('c1', 'doing', 0);
    const state = board.getState();
    expect(state.find((c) => c.id === 'todo')!.cards.map((c) => c.id)).toEqual([
      'c2',
    ]);
    expect(state.find((c) => c.id === 'doing')!.cards.map((c) => c.id)).toEqual(
      ['c1'],
    );
  });

  test('moveCard fires onChange', () => {
    const { board, onChange } = setup();
    board.moveCard('c1', 'doing', 0);
    expect(onChange).toHaveBeenCalled();
  });

  test('cards are draggable', () => {
    const { container } = setup();
    const card = container.querySelector('[data-card]') as HTMLElement;
    expect(card.getAttribute('draggable')).toBe('true');
  });

  test('dragover on column adds highlight class', () => {
    const { container } = setup();
    const col = container.querySelector('[data-column="doing"]') as HTMLElement;
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    col.dispatchEvent(event);
    expect(col.classList.contains('drag-over')).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  test('dragleave removes highlight', () => {
    const { container } = setup();
    const col = container.querySelector('[data-column="doing"]') as HTMLElement;
    col.dispatchEvent(
      new Event('dragover', { bubbles: true, cancelable: true }),
    );
    col.dispatchEvent(new Event('dragleave', { bubbles: true }));
    expect(col.classList.contains('drag-over')).toBe(false);
  });

  test('drop moves card to target column', () => {
    const { container, board } = setup();
    const card = container.querySelector('[data-card="c1"]') as HTMLElement;
    const data = new Map<string, string>();
    const dataTransfer = {
      setData: (k: string, v: string) => data.set(k, v),
      getData: (k: string) => data.get(k) ?? '',
      effectAllowed: 'move',
    } as unknown as DataTransfer;
    const dragStart = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStart, 'dataTransfer', { value: dataTransfer });
    card.dispatchEvent(dragStart);

    const target = container.querySelector(
      '[data-column="done"]',
    ) as HTMLElement;
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: dataTransfer });
    target.dispatchEvent(drop);

    expect(
      board
        .getState()
        .find((c) => c.id === 'done')!
        .cards.map((c) => c.id),
    ).toEqual(['c1']);
  });

  test('destroy clears DOM', () => {
    const { container, board } = setup();
    board.destroy();
    expect(container.children.length).toBe(0);
  });
});

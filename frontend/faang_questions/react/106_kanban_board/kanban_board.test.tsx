/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { KanbanBoard, moveCard, reorderColumn, type Board } from './kanban_board';

function makeBoard(): Board {
  return {
    columns: [
      { id: 'todo', title: 'To review', cardIds: ['c1', 'c2', 'c3'] },
      { id: 'doing', title: 'In QC', cardIds: ['c4'] },
      { id: 'done', title: 'Approved', cardIds: [] },
    ],
    cards: {
      c1: { id: 'c1', title: 'Teaser 15s' },
      c2: { id: 'c2', title: 'Trailer 60s' },
      c3: { id: 'c3', title: 'Recap' },
      c4: { id: 'c4', title: 'Cold open' },
    },
  };
}

const ids = (board: Board, columnId: string) =>
  board.columns.find((c) => c.id === columnId)!.cardIds;

describe('pure: moveCard', () => {
  it('moves a card into another column at the given index', () => {
    const board = makeBoard();
    const next = moveCard(board, 'c1', 'doing', 1);
    expect(ids(next, 'todo')).toEqual(['c2', 'c3']);
    expect(ids(next, 'doing')).toEqual(['c4', 'c1']);
    expect(ids(board, 'todo')).toEqual(['c1', 'c2', 'c3']); // input untouched
  });

  it('reorders within the same column using the index after removal', () => {
    const board = makeBoard();
    expect(ids(moveCard(board, 'c1', 'todo', 2), 'todo')).toEqual(['c2', 'c3', 'c1']);
    expect(ids(moveCard(board, 'c3', 'todo', 0), 'todo')).toEqual(['c3', 'c1', 'c2']);
  });

  it('clamps the index into [0, length]', () => {
    const board = makeBoard();
    expect(ids(moveCard(board, 'c4', 'todo', 99), 'todo')).toEqual(['c1', 'c2', 'c3', 'c4']);
    expect(ids(moveCard(board, 'c4', 'todo', -5), 'todo')).toEqual(['c4', 'c1', 'c2', 'c3']);
  });

  it('returns the same board for an unknown card or column', () => {
    const board = makeBoard();
    expect(moveCard(board, 'nope', 'doing', 0)).toBe(board);
    expect(moveCard(board, 'c1', 'nope', 0)).toBe(board);
  });

  it('senior: no-op moves return the same reference and real moves share untouched columns', () => {
    const board = makeBoard();
    expect(moveCard(board, 'c2', 'todo', 1)).toBe(board);

    const next = moveCard(board, 'c1', 'doing', 0);
    expect(next).not.toBe(board);
    expect(next.cards).toBe(board.cards);
    expect(next.columns[2]).toBe(board.columns[2]); // Approved untouched
    expect(next.columns[0]).not.toBe(board.columns[0]);
    expect(next.columns[1]).not.toBe(board.columns[1]);
  });
});

describe('pure: reorderColumn', () => {
  it('moves the card at `from` to `to` within the column', () => {
    const board = makeBoard();
    expect(ids(reorderColumn(board, 'todo', 0, 2), 'todo')).toEqual(['c2', 'c3', 'c1']);
    expect(ids(reorderColumn(board, 'todo', 2, 0), 'todo')).toEqual(['c3', 'c1', 'c2']);
  });

  it('returns the same board when nothing changes or the index is out of range', () => {
    const board = makeBoard();
    expect(reorderColumn(board, 'todo', 1, 1)).toBe(board);
    expect(reorderColumn(board, 'todo', 7, 0)).toBe(board);
    expect(reorderColumn(board, 'nope', 0, 1)).toBe(board);
  });
});

function Harness({ onChange, initial = makeBoard() }: { onChange?: (b: Board) => void; initial?: Board }) {
  const [board, setBoard] = useState(initial);
  return (
    <KanbanBoard
      value={board}
      onChange={(next) => {
        onChange?.(next);
        setBoard(next);
      }}
    />
  );
}

const column = (name: string) => screen.getByRole('list', { name });
const cardTitles = (name: string) =>
  within(column(name))
    .queryAllByRole('listitem')
    .map((li) => li.textContent?.replace(/Move$/, '').trim());
const cardFor = (title: string) => screen.getByText(title).closest('li') as HTMLElement;
const moveButton = (title: string) => within(cardFor(title)).getByRole('button', { name: 'Move' });
const status = () => screen.getByRole('status');

describe('1. rendering', () => {
  it('renders one list per column, named by its title, with a listitem per card', () => {
    render(<Harness />);
    expect(screen.getAllByRole('list')).toHaveLength(3);
    expect(cardTitles('To review')).toEqual(['Teaser 15s', 'Trailer 60s', 'Recap']);
    expect(cardTitles('In QC')).toEqual(['Cold open']);
    expect(cardTitles('Approved')).toEqual([]);
  });

  it('gives every card a Move button that is not pressed', () => {
    render(<Harness />);
    const buttons = screen.getAllByRole('button', { name: 'Move' });
    expect(buttons).toHaveLength(4);
    for (const b of buttons) expect(b).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('2. keyboard move mode', () => {
  it('Move enters move mode: aria-pressed and a status announcement', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(moveButton('Trailer 60s'));
    expect(moveButton('Trailer 60s')).toHaveAttribute('aria-pressed', 'true');
    expect(status()).toHaveTextContent(
      'Moving "Trailer 60s". Use arrow keys to choose a position, Enter to drop, Escape to cancel',
    );
  });

  it('ArrowRight then Enter drops the card into the next column via onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    await user.click(moveButton('Trailer 60s'));
    await user.keyboard('{ArrowRight}');
    expect(status()).toHaveTextContent('In QC');
    expect(cardTitles('In QC')).toContain('Trailer 60s'); // live preview
    expect(moveButton('Trailer 60s')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Board;
    expect(ids(next, 'todo')).toEqual(['c1', 'c3']);
    expect(ids(next, 'doing')).toEqual(['c4', 'c2']);
    expect(moveButton('Trailer 60s')).toHaveAttribute('aria-pressed', 'false');
  });

  it('ArrowDown / ArrowUp choose the index inside the column', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    await user.click(moveButton('Teaser 15s'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}'); // clamped at the end
    expect(cardTitles('To review')).toEqual(['Trailer 60s', 'Recap', 'Teaser 15s']);
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ids(onChange.mock.calls[0][0] as Board, 'todo')).toEqual(['c2', 'c1', 'c3']);
    expect(cardTitles('To review')).toEqual(['Trailer 60s', 'Teaser 15s', 'Recap']);
  });

  it('Escape restores the original board without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    await user.click(moveButton('Recap'));
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(cardTitles('Approved')).toEqual(['Recap']);
    await user.keyboard('{Escape}');
    expect(cardTitles('Approved')).toEqual([]);
    expect(cardTitles('To review')).toEqual(['Teaser 15s', 'Trailer 60s', 'Recap']);
    expect(onChange).not.toHaveBeenCalled();
    expect(moveButton('Recap')).toHaveAttribute('aria-pressed', 'false');
  });

  it('senior: Enter without moving anywhere is a no-op (no onChange)', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    await user.click(moveButton('Cold open'));
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(moveButton('Cold open')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('3. pointer drag', () => {
  // jsdom has no layout and (in this version) no elementFromPoint: stub it and
  // dispatch pointer events carrying clientX/Y ourselves.
  const pointer = (target: EventTarget, type: string, x: number, y: number) =>
    act(() => {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    });

  let elementFromPoint: jest.Mock;
  beforeEach(() => {
    elementFromPoint = jest.fn();
    Object.defineProperty(document, 'elementFromPoint', { value: elementFromPoint, configurable: true });
  });
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).elementFromPoint;
  });

  const dropZone = (name: string) => column(name).closest('[data-column-id]') as HTMLElement;

  it('pointerdown + pointermove + pointerup over another column calls onChange once', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    elementFromPoint.mockReturnValue(dropZone('Approved'));

    pointer(cardFor('Teaser 15s'), 'pointerdown', 10, 10);
    pointer(document, 'pointermove', 300, 40);
    pointer(document, 'pointerup', 300, 40);

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Board;
    expect(ids(next, 'done')).toEqual(['c1']);
    expect(ids(next, 'todo')).toEqual(['c2', 'c3']);
    expect(cardTitles('Approved')).toEqual(['Teaser 15s']);
  });

  it('appends after the cards whose midpoint is above the pointer', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    elementFromPoint.mockReturnValue(dropZone('To review'));

    pointer(cardFor('Cold open'), 'pointerdown', 200, 10);
    pointer(document, 'pointermove', 20, 500);
    pointer(document, 'pointerup', 20, 500); // every (0-height) card midpoint is above y=500

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ids(onChange.mock.calls[0][0] as Board, 'todo')).toEqual(['c1', 'c2', 'c3', 'c4']);
  });

  it('a release outside any column, or without moving, does nothing', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    elementFromPoint.mockReturnValue(document.body);
    pointer(cardFor('Teaser 15s'), 'pointerdown', 10, 10);
    pointer(document, 'pointermove', 900, 900);
    pointer(document, 'pointerup', 900, 900);

    elementFromPoint.mockReturnValue(dropZone('Approved'));
    pointer(cardFor('Teaser 15s'), 'pointerdown', 10, 10);
    pointer(document, 'pointerup', 10, 10); // no pointermove => a click, not a drag
    expect(onChange).not.toHaveBeenCalled();
  });

  it('senior: dropping a card onto its own position is a no-op', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    elementFromPoint.mockReturnValue(dropZone('To review'));

    pointer(cardFor('Recap'), 'pointerdown', 10, 10); // already last in To review
    pointer(document, 'pointermove', 12, 500);
    pointer(document, 'pointerup', 12, 500);
    expect(onChange).not.toHaveBeenCalled();
    expect(cardTitles('To review')).toEqual(['Teaser 15s', 'Trailer 60s', 'Recap']);
  });
});

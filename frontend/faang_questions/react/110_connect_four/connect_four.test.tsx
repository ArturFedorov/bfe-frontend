/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConnectFour,
  checkWinner,
  createBoard,
  drop,
  undo,
  winningCells,
  type Board,
  type Cell,
} from './connect_four';

// ---- helpers ----------------------------------------------------------------

const drops = (board: Board, cols: number[]): Board => cols.reduce(drop, board);

/** Build a cells grid from strings: '.' empty, '1' / '2' tokens. Row 0 is the top. */
const grid = (...lines: string[]): Cell[][] =>
  lines.map((line) => [...line].map((ch) => (ch === '.' ? 0 : (Number(ch) as Cell))));

const statusEl = () => screen.getByRole('status');
const header = (n: number) => screen.getByRole('columnheader', { name: `Drop in column ${n}` });
const cell = (label: string) => screen.getByRole('gridcell', { name: label });
const winningEls = () => document.querySelectorAll('[data-winning]');

/** Player 1 wins on the bottom row (columns 1–4) after 7 moves. */
const HORIZONTAL_WIN = [0, 0, 1, 1, 2, 2, 3];
/** Player 1 wins on the rising diagonal (6,1) (5,2) (4,3) (3,4) in 1-based labels. */
const DIAGONAL_WIN = [0, 1, 1, 2, 2, 3, 2, 3, 3, 0, 3];

// ---- pure: createBoard ------------------------------------------------------

describe('createBoard', () => {
  it('creates an empty 6x7 board by default with Player 1 to move', () => {
    const b = createBoard();
    expect(b.cells).toHaveLength(6);
    expect(b.cells.every((row) => row.length === 7 && row.every((c) => c === 0))).toBe(true);
    expect(b.current).toBe(1);
    expect(b.winner).toBe(0);
    expect(b.history).toEqual([]);
  });

  it('accepts custom dimensions', () => {
    const b = createBoard(4, 5);
    expect(b.cells).toHaveLength(4);
    expect(b.cells[0]).toHaveLength(5);
  });
});

// ---- pure: drop -------------------------------------------------------------

describe('drop', () => {
  it('applies gravity: the first token lands on the bottom row, the next one on top of it', () => {
    const b1 = drop(createBoard(), 3);
    expect(b1.cells[5][3]).toBe(1);
    expect(b1.current).toBe(2);
    expect(b1.history).toEqual([3]);

    const b2 = drop(b1, 3);
    expect(b2.cells[4][3]).toBe(2);
    expect(b2.cells[5][3]).toBe(1);
    expect(b2.current).toBe(1);
    expect(b2.history).toEqual([3, 3]);
  });

  it('does not mutate the previous board', () => {
    const b0 = createBoard();
    const snapshot = JSON.stringify(b0);
    drop(b0, 0);
    expect(JSON.stringify(b0)).toBe(snapshot);
  });

  it('returns the same reference for a full column', () => {
    const b = drops(createBoard(2, 2), [0, 0]);
    expect(b.cells[0][0]).toBe(2);
    expect(drop(b, 0)).toBe(b);
  });

  it('returns the same reference for an out-of-range column', () => {
    const b = createBoard();
    expect(drop(b, -1)).toBe(b);
    expect(drop(b, 7)).toBe(b);
  });

  it('returns the same reference once the game is finished', () => {
    const won = drops(createBoard(), HORIZONTAL_WIN);
    expect(won.winner).toBe(1);
    expect(drop(won, 6)).toBe(won);
  });

  it('declares a draw when the board fills without a winner', () => {
    const b = drops(createBoard(2, 2), [0, 0, 1, 1]);
    expect(b.winner).toBe('draw');
    expect(b.history).toHaveLength(4);
  });
});

// ---- pure: checkWinner ------------------------------------------------------

describe('checkWinner', () => {
  it('returns 0 for an empty cell or a board without four in a row', () => {
    const cells = grid('.......', '.......', '.......', '.......', '.......', '112.21.');
    expect(checkWinner(cells, 5, 0)).toBe(0);
    expect(checkWinner(cells, 0, 0)).toBe(0);
  });

  it('detects a horizontal win from either end or the middle of the run', () => {
    const cells = grid('.......', '.......', '.......', '.......', '.......', '.1111..');
    expect(checkWinner(cells, 5, 1)).toBe(1);
    expect(checkWinner(cells, 5, 4)).toBe(1);
    expect(checkWinner(cells, 5, 2)).toBe(1);
  });

  it('detects a vertical win', () => {
    const cells = grid('.......', '.......', '2......', '2......', '2......', '2......');
    expect(checkWinner(cells, 2, 0)).toBe(2);
  });

  it('detects both diagonals (senior)', () => {
    const rising = grid('.......', '.......', '...1...', '..1....', '.1.....', '1......');
    expect(checkWinner(rising, 2, 3)).toBe(1);
    expect(checkWinner(rising, 5, 0)).toBe(1);

    const falling = grid('.......', '.......', '2......', '.2.....', '..2....', '...2...');
    expect(checkWinner(falling, 5, 3)).toBe(2);
  });

  it('does not count a different player across a gap', () => {
    const cells = grid('.......', '.......', '.......', '.......', '.......', '11.11..');
    expect(checkWinner(cells, 5, 3)).toBe(0);
  });
});

// ---- pure: winningCells -----------------------------------------------------

describe('winningCells', () => {
  it('returns null when nobody has won', () => {
    expect(winningCells(createBoard().cells)).toBeNull();
    expect(winningCells(grid('.......', '.......', '.......', '.......', '.......', '112.21.'))).toBeNull();
  });

  it('returns the four coordinates of a horizontal win', () => {
    const cells = grid('.......', '.......', '.......', '.......', '.......', '.1111..');
    expect(winningCells(cells)).toEqual([
      [5, 1],
      [5, 2],
      [5, 3],
      [5, 4],
    ]);
  });

  it('returns the diagonal coordinates after a diagonal win', () => {
    const b = drops(createBoard(), DIAGONAL_WIN);
    expect(b.winner).toBe(1);
    expect(winningCells(b.cells)).toEqual(
      expect.arrayContaining([
        [5, 0],
        [4, 1],
        [3, 2],
        [2, 3],
      ]),
    );
    expect(winningCells(b.cells)).toHaveLength(4);
  });
});

// ---- pure: undo -------------------------------------------------------------

describe('undo', () => {
  it('returns the same reference on an empty history', () => {
    const b = createBoard();
    expect(undo(b)).toBe(b);
  });

  it('removes the topmost token of the last column and hands the turn back', () => {
    const b = drops(createBoard(), [3, 3]);
    const u = undo(b);
    expect(u.cells[4][3]).toBe(0);
    expect(u.cells[5][3]).toBe(1);
    expect(u.current).toBe(2);
    expect(u.history).toEqual([3]);
  });

  it('clears a win and re-opens the game (senior)', () => {
    const won = drops(createBoard(), HORIZONTAL_WIN);
    const u = undo(won);
    expect(u.winner).toBe(0);
    expect(u.current).toBe(1);
    expect(drop(u, 6)).not.toBe(u);
  });
});

// ---- component --------------------------------------------------------------

describe('ConnectFour: rendering', () => {
  it('renders a labelled grid with a header button per column and a labelled cell per square', () => {
    render(<ConnectFour />);
    expect(screen.getByRole('grid', { name: 'Connect Four' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    expect(header(1)).toBeEnabled();
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    expect(cell('Row 6, column 1: empty')).toBeInTheDocument();
    expect(cell('Row 1, column 7: empty')).toBeInTheDocument();
    expect(statusEl()).toHaveTextContent("Player 1's turn");
  });

  it('shows the current player in a label that does not announce (aria-live="off")', () => {
    render(<ConnectFour />);
    expect(screen.getByText('Player 1')).toHaveAttribute('aria-live', 'off');
  });

  it('honours rows / cols props', () => {
    render(<ConnectFour rows={4} cols={5} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(screen.getAllByRole('gridcell')).toHaveLength(20);
  });
});

describe('ConnectFour: dropping tokens', () => {
  it('clicking a column header drops into the lowest empty row and switches turns', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    await user.click(header(3));
    expect(cell('Row 6, column 3: Player 1')).toBeInTheDocument();
    expect(statusEl()).toHaveTextContent("Player 2's turn");
    expect(screen.getByText('Player 2')).toBeInTheDocument();

    await user.click(header(3));
    expect(cell('Row 5, column 3: Player 2')).toBeInTheDocument();
    expect(statusEl()).toHaveTextContent("Player 1's turn");
  });

  it('disables the header of a full column', async () => {
    const user = userEvent.setup();
    render(<ConnectFour rows={2} cols={3} />);
    await user.click(header(1));
    await user.click(header(1));
    expect(header(1)).toBeDisabled();
    expect(header(2)).toBeEnabled();
  });
});

describe('ConnectFour: win, draw and undo', () => {
  it('announces the winner, marks the winning cells and disables every header', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    for (const c of HORIZONTAL_WIN) await user.click(header(c + 1));

    expect(statusEl()).toHaveTextContent('Player 1 wins!');
    const marked = winningEls();
    expect(marked).toHaveLength(4);
    expect(cell('Row 6, column 1: Player 1')).toHaveAttribute('data-winning');
    expect(cell('Row 6, column 4: Player 1')).toHaveAttribute('data-winning');
    for (let c = 1; c <= 7; c++) expect(header(c)).toBeDisabled();
  });

  it('detects a diagonal win played through the UI (senior)', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    for (const c of DIAGONAL_WIN) await user.click(header(c + 1));

    expect(statusEl()).toHaveTextContent('Player 1 wins!');
    expect(cell('Row 6, column 1: Player 1')).toHaveAttribute('data-winning');
    expect(cell('Row 5, column 2: Player 1')).toHaveAttribute('data-winning');
    expect(cell('Row 4, column 3: Player 1')).toHaveAttribute('data-winning');
    expect(cell('Row 3, column 4: Player 1')).toHaveAttribute('data-winning');
  });

  it('announces a draw when the board fills up', async () => {
    const user = userEvent.setup();
    render(<ConnectFour rows={2} cols={2} />);
    await user.click(header(1));
    await user.click(header(1));
    await user.click(header(2));
    await user.click(header(2));
    expect(statusEl()).toHaveTextContent('Draw');
    expect(winningEls()).toHaveLength(0);
  });

  it('Undo is disabled on an empty board and removes the last token otherwise', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    const undoBtn = screen.getByRole('button', { name: 'Undo' });
    expect(undoBtn).toBeDisabled();

    await user.click(header(2));
    expect(undoBtn).toBeEnabled();
    await user.click(undoBtn);
    expect(cell('Row 6, column 2: empty')).toBeInTheDocument();
    expect(statusEl()).toHaveTextContent("Player 1's turn");
    expect(undoBtn).toBeDisabled();
  });

  it('undo after a win re-enables play and clears data-winning (senior)', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    for (const c of HORIZONTAL_WIN) await user.click(header(c + 1));
    expect(winningEls()).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(statusEl()).toHaveTextContent("Player 1's turn");
    expect(winningEls()).toHaveLength(0);
    expect(cell('Row 6, column 4: empty')).toBeInTheDocument();
    expect(header(7)).toBeEnabled();

    await user.click(header(7));
    expect(cell('Row 6, column 7: Player 1')).toBeInTheDocument();
    expect(statusEl()).toHaveTextContent("Player 2's turn");
  });

  it('New game clears the board, the status and the history', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    for (const c of HORIZONTAL_WIN) await user.click(header(c + 1));
    await user.click(screen.getByRole('button', { name: 'New game' }));

    expect(statusEl()).toHaveTextContent("Player 1's turn");
    expect(screen.getAllByRole('gridcell', { name: /: empty$/ })).toHaveLength(42);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(header(1)).toBeEnabled();
  });
});

describe('ConnectFour: keyboard', () => {
  it('ArrowLeft / ArrowRight move the column cursor (aria-selected on the header) and clamp at the edges', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    const gridEl = screen.getByRole('grid', { name: 'Connect Four' });
    gridEl.focus();
    expect(header(1)).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(header(1)).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(header(3)).toHaveAttribute('aria-selected', 'true');
    expect(header(1)).toHaveAttribute('aria-selected', 'false');

    for (let i = 0; i < 10; i++) await user.keyboard('{ArrowRight}');
    expect(header(7)).toHaveAttribute('aria-selected', 'true');
  });

  it('Enter and Space drop into the selected column', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    screen.getByRole('grid', { name: 'Connect Four' }).focus();

    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    expect(cell('Row 6, column 3: Player 1')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(cell('Row 5, column 3: Player 2')).toBeInTheDocument();
    expect(statusEl()).toHaveTextContent("Player 1's turn");
  });

  it('clicking a header moves the cursor to that column', async () => {
    const user = userEvent.setup();
    render(<ConnectFour />);
    await user.click(header(5));
    expect(header(5)).toHaveAttribute('aria-selected', 'true');
  });
});

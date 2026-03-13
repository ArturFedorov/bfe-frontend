import { createTicTacToe } from './ticTacToe';

describe('createTicTacToe', () => {
  test('starts with empty board and player X', () => {
    const game = createTicTacToe();
    const board = game.getBoard();
    expect(board).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    expect(game.getCurrentPlayer()).toBe('X');
  });

  test('alternates between X and O', () => {
    const game = createTicTacToe();
    expect(game.getCurrentPlayer()).toBe('X');
    game.makeMove(0, 0);
    expect(game.getCurrentPlayer()).toBe('O');
    game.makeMove(0, 1);
    expect(game.getCurrentPlayer()).toBe('X');
  });

  test('makeMove places mark on board', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0);
    expect(game.getBoard()[0][0]).toBe('X');
    game.makeMove(1, 1);
    expect(game.getBoard()[1][1]).toBe('O');
  });

  test('detects row win', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0); // X
    game.makeMove(1, 0); // O
    game.makeMove(0, 1); // X
    game.makeMove(1, 1); // O
    game.makeMove(0, 2); // X wins row 0
    expect(game.getWinner()).toBe('X');
  });

  test('detects column win', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0); // X
    game.makeMove(0, 1); // O
    game.makeMove(1, 0); // X
    game.makeMove(1, 1); // O
    game.makeMove(2, 0); // X wins col 0
    expect(game.getWinner()).toBe('X');
  });

  test('detects diagonal win (top-left to bottom-right)', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0); // X
    game.makeMove(0, 1); // O
    game.makeMove(1, 1); // X
    game.makeMove(0, 2); // O
    game.makeMove(2, 2); // X wins diagonal
    expect(game.getWinner()).toBe('X');
  });

  test('detects anti-diagonal win (top-right to bottom-left)', () => {
    const game = createTicTacToe();
    game.makeMove(0, 2); // X
    game.makeMove(0, 0); // O
    game.makeMove(1, 1); // X
    game.makeMove(0, 1); // O
    game.makeMove(2, 0); // X wins anti-diagonal
    expect(game.getWinner()).toBe('X');
  });

  test('detects draw', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0); // X
    game.makeMove(0, 1); // O
    game.makeMove(0, 2); // X
    game.makeMove(1, 0); // O
    game.makeMove(1, 1); // X
    game.makeMove(2, 0); // O
    game.makeMove(1, 2); // X
    game.makeMove(2, 2); // O
    game.makeMove(2, 1); // X
    expect(game.isDraw()).toBe(true);
    expect(game.getWinner()).toBeNull();
  });

  test('invalid move on occupied cell returns false', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0);
    expect(game.makeMove(0, 0)).toBe(false);
  });

  test('invalid move returns false and does not change player', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0); // X -> O
    const player = game.getCurrentPlayer();
    game.makeMove(0, 0); // invalid
    expect(game.getCurrentPlayer()).toBe(player);
  });

  test('no moves allowed after win', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0); // X
    game.makeMove(1, 0); // O
    game.makeMove(0, 1); // X
    game.makeMove(1, 1); // O
    game.makeMove(0, 2); // X wins
    expect(game.makeMove(2, 2)).toBe(false);
  });

  test('reset clears board and resets player', () => {
    const game = createTicTacToe();
    game.makeMove(0, 0);
    game.makeMove(1, 1);
    game.reset();
    expect(game.getBoard()).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
    expect(game.getCurrentPlayer()).toBe('X');
    expect(game.getWinner()).toBeNull();
    expect(game.isDraw()).toBe(false);
  });

  test('valid move returns true', () => {
    const game = createTicTacToe();
    expect(game.makeMove(0, 0)).toBe(true);
  });
});

export interface TicTacToeGame {
  getBoard: () => (string | null)[][];
  getCurrentPlayer: () => string;
  makeMove: (row: number, col: number) => boolean;
  getWinner: () => string | null;
  isDraw: () => boolean;
  reset: () => void;
}

export function createTicTacToe(): TicTacToeGame {
  return {
    getBoard: () => [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    getCurrentPlayer: () => 'X',
    makeMove: () => false,
    getWinner: () => null,
    isDraw: () => false,
    reset() {},
  };
}

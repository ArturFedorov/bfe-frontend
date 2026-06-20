import { solve } from './surrounded_regions';

describe('LC 130. Surrounded Regions', () => {
  it('captures regions surrounded by X', () => {
    const board = [
      ['X', 'X', 'X', 'X'],
      ['X', 'O', 'O', 'X'],
      ['X', 'X', 'O', 'X'],
      ['X', 'O', 'X', 'X'],
    ];
    solve(board);
    expect(board).toEqual([
      ['X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X'],
      ['X', 'O', 'X', 'X'],
    ]);
  });

  it('does not capture a single border cell', () => {
    const board = [['X']];
    solve(board);
    expect(board).toEqual([['X']]);
  });

  it('leaves a lone border O untouched', () => {
    const board = [['O']];
    solve(board);
    expect(board).toEqual([['O']]);
  });

  it('keeps O regions connected to the border', () => {
    const board = [
      ['O', 'O', 'O'],
      ['O', 'X', 'O'],
      ['O', 'O', 'O'],
    ];
    solve(board);
    expect(board).toEqual([
      ['O', 'O', 'O'],
      ['O', 'X', 'O'],
      ['O', 'O', 'O'],
    ]);
  });

  it('captures a fully enclosed region but not a border-connected one', () => {
    const board = [
      ['X', 'X', 'X', 'X', 'X'],
      ['X', 'O', 'O', 'X', 'X'],
      ['X', 'O', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'O', 'O'],
    ];
    solve(board);
    expect(board).toEqual([
      ['X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'X', 'X'],
      ['X', 'X', 'X', 'O', 'O'],
    ]);
  });
});

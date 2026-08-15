import { badgeAccessPath, Cell, Position } from './badge_access_path';

function g(rows: string[]): Cell[][] {
  return rows.map((row) => row.split('') as Cell[]);
}

describe('badgeAccessPath', () => {
  it('walks a straight open corridor', () => {
    expect(badgeAccessPath(g(['....']), [0, 0], [0, 3])).toBe(3);
  });

  it('returns 0 when start equals end', () => {
    expect(badgeAccessPath(g(['.']), [0, 0], [0, 0])).toBe(0);
    expect(badgeAccessPath(g(['..', '..']), [1, 1], [1, 1])).toBe(0);
  });

  it('returns -1 when walls fully block the route', () => {
    expect(badgeAccessPath(g(['.#.']), [0, 0], [0, 2])).toBe(-1);
  });

  it('returns -1 for the empty grid', () => {
    expect(badgeAccessPath([], [0, 0], [0, 0])).toBe(-1);
    expect(badgeAccessPath([[]], [0, 0], [0, 0])).toBe(-1);
  });

  it('uses the bypass when the door shortcut is shorter', () => {
    const grid = g([
      '.D.',
      '...',
    ]);
    expect(badgeAccessPath(grid, [0, 0], [0, 2])).toBe(2);
  });

  it('finds the route when it is only possible via the bypass', () => {
    const grid = g([
      '.D.',
      '#D#',
    ]);
    expect(badgeAccessPath(grid, [0, 0], [0, 2])).toBe(2);
  });

  it('returns -1 when every route needs two doors', () => {
    expect(badgeAccessPath(g(['.DD.']), [0, 0], [0, 3])).toBe(-1);
    const grid = g([
      '.D.',
      '#D#',
      '.D.',
    ]);
    expect(badgeAccessPath(grid, [0, 0], [2, 2])).toBe(-1);
  });

  it('does not spend the bypass when a clean route is as short', () => {
    const grid = g([
      '.D.',
      '...',
    ]);
    // both the door route and the detour exist; answer is the minimum
    expect(badgeAccessPath(grid, [0, 0], [1, 2])).toBe(3);
  });

  it('prefers a longer clean route over an impossible double-door shortcut', () => {
    const grid = g([
      '.DD.',
      '....',
    ]);
    // straight through needs two doors; go around: down, right x3, up = 5
    expect(badgeAccessPath(grid, [0, 0], [0, 3])).toBe(5);
  });

  it('saves the bypass for a later door when using it early dead-ends', () => {
    // Reaching the end requires the door at [2][2]. The tempting early door
    // at [1][0] wastes the bypass in a pocket. A visited-set keyed on
    // position alone (ignoring the bypass flag) fails this grid.
    const grid = g([
      '..#.',
      'D.#.',
      '..D.',
    ]);
    expect(badgeAccessPath(grid, [0, 0], [0, 3])).toBe(7);
  });

  it('handles cycles in open areas without revisiting states', () => {
    const grid = g([
      '...',
      '.#.',
      '...',
    ]);
    expect(badgeAccessPath(grid, [0, 0], [2, 2])).toBe(4);
  });

  it('treats an unused door elsewhere as irrelevant', () => {
    const grid = g([
      '...',
      'D#.',
      '...',
    ]);
    expect(badgeAccessPath(grid, [0, 0], [2, 2])).toBe(4);
  });

  it('crosses a 200x200 floor split by a wall with a single door', () => {
    const size = 200;
    const rows: string[] = [];
    for (let r = 0; r < size; r++) {
      if (r === 100) {
        rows.push('D' + '#'.repeat(size - 1));
      } else {
        rows.push('.'.repeat(size));
      }
    }
    const grid = g(rows);
    const start: Position = [0, 0];
    const end: Position = [size - 1, size - 1];
    // manhattan distance is achievable: down column 0 through the door, then across
    expect(badgeAccessPath(grid, start, end)).toBe(2 * (size - 1));

    // seal the door: the floor is split and no route exists
    grid[100][0] = '#';
    expect(badgeAccessPath(grid, start, end)).toBe(-1);
  });
});

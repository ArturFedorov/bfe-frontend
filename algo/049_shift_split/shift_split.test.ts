import { canSplitShifts, Conflict } from './shift_split';

describe('canSplitShifts', () => {
  it('splits a simple conflict chain', () => {
    const conflicts: Conflict[] = [
      ['ana', 'bo'],
      ['bo', 'kim'],
    ];
    expect(canSplitShifts(['ana', 'bo', 'kim'], conflicts)).toBe(true);
  });

  it('rejects an odd conflict triangle', () => {
    const conflicts: Conflict[] = [
      ['ana', 'bo'],
      ['bo', 'kim'],
      ['kim', 'ana'],
    ];
    expect(canSplitShifts(['ana', 'bo', 'kim'], conflicts)).toBe(false);
  });

  it('accepts an even conflict cycle', () => {
    const conflicts: Conflict[] = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'a'],
    ];
    expect(canSplitShifts(['a', 'b', 'c', 'd'], conflicts)).toBe(true);
  });

  it('rejects an odd cycle longer than a triangle', () => {
    const conflicts: Conflict[] = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'e'],
      ['e', 'a'],
    ];
    expect(canSplitShifts(['a', 'b', 'c', 'd', 'e'], conflicts)).toBe(false);
  });

  it('returns true with no conflicts at all', () => {
    expect(canSplitShifts(['ana', 'bo', 'kim'], [])).toBe(true);
  });

  it('returns true for the empty employee list', () => {
    expect(canSplitShifts([], [])).toBe(true);
  });

  it('returns true for a single employee', () => {
    expect(canSplitShifts(['solo'], [])).toBe(true);
  });

  it('checks every disconnected component', () => {
    const employees = ['a', 'b', 'c', 'x', 'y', 'z', 'lone'];
    const okAndBadComponents: Conflict[] = [
      ['a', 'b'], // component 1: fine
      ['x', 'y'],
      ['y', 'z'],
      ['z', 'x'], // component 2: odd triangle
    ];
    expect(canSplitShifts(employees, okAndBadComponents)).toBe(false);

    const allOk: Conflict[] = [
      ['a', 'b'],
      ['x', 'y'],
      ['y', 'z'],
    ];
    expect(canSplitShifts(employees, allOk)).toBe(true);
  });

  it('ignores duplicate and reversed conflict pairs', () => {
    const conflicts: Conflict[] = [
      ['ana', 'bo'],
      ['bo', 'ana'],
      ['ana', 'bo'],
    ];
    expect(canSplitShifts(['ana', 'bo'], conflicts)).toBe(true);
  });

  it('handles two independent odd-free cycles sharing no members', () => {
    const conflicts: Conflict[] = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'a'],
      ['p', 'q'],
      ['q', 'r'],
      ['r', 's'],
      ['s', 'p'],
    ];
    expect(
      canSplitShifts(['a', 'b', 'c', 'd', 'p', 'q', 'r', 's'], conflicts),
    ).toBe(true);
  });

  it('handles a large 50k-employee even cycle', () => {
    const n = 50000; // even
    const employees: string[] = [];
    const conflicts: Conflict[] = [];
    for (let i = 0; i < n; i++) {
      employees.push(`e${i}`);
      conflicts.push([`e${i}`, `e${(i + 1) % n}`]);
    }
    expect(canSplitShifts(employees, conflicts)).toBe(true);
  });

  it('rejects a large odd cycle', () => {
    const n = 50001; // odd
    const employees: string[] = [];
    const conflicts: Conflict[] = [];
    for (let i = 0; i < n; i++) {
      employees.push(`e${i}`);
      conflicts.push([`e${i}`, `e${(i + 1) % n}`]);
    }
    expect(canSplitShifts(employees, conflicts)).toBe(false);
  });
});

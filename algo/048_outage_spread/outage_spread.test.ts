import { outageSpread, OutageInput } from './outage_spread';

describe('outageSpread', () => {
  it('spreads from a single corner source around a blocked center', () => {
    const input: OutageInput = {
      grid: [
        ['a', 'b', 'c'],
        ['d', null, 'e'],
        ['f', 'g', 'h'],
      ],
      initialFailures: ['a'],
    };
    expect(outageSpread(input)).toEqual({ minutes: 4, unaffected: [] });
  });

  it('spreads simultaneously from multiple sources', () => {
    const input: OutageInput = {
      grid: [['a', 'b', 'c', 'd', 'e']],
      initialFailures: ['a', 'e'],
    };
    // b and d fail at minute 1, c at minute 2
    expect(outageSpread(input)).toEqual({ minutes: 2, unaffected: [] });
  });

  it('reports servers isolated by empty slots as unaffected', () => {
    const input: OutageInput = {
      grid: [['a', null, 'b']],
      initialFailures: ['a'],
    };
    expect(outageSpread(input)).toEqual({ minutes: 0, unaffected: ['b'] });
  });

  it('returns all servers unaffected when there are no initial failures', () => {
    const input: OutageInput = {
      grid: [
        ['b', 'a'],
        [null, 'c'],
      ],
      initialFailures: [],
    };
    expect(outageSpread(input)).toEqual({
      minutes: 0,
      unaffected: ['a', 'b', 'c'],
    });
  });

  it('returns minutes 0 when every server is already failed', () => {
    const input: OutageInput = {
      grid: [['a', 'b']],
      initialFailures: ['a', 'b'],
    };
    expect(outageSpread(input)).toEqual({ minutes: 0, unaffected: [] });
  });

  it('handles the empty grid', () => {
    expect(outageSpread({ grid: [], initialFailures: [] })).toEqual({
      minutes: 0,
      unaffected: [],
    });
    expect(outageSpread({ grid: [[]], initialFailures: [] })).toEqual({
      minutes: 0,
      unaffected: [],
    });
  });

  it('handles a single-server grid', () => {
    expect(
      outageSpread({ grid: [['only']], initialFailures: ['only'] })
    ).toEqual({ minutes: 0, unaffected: [] });
    expect(
      outageSpread({ grid: [['only']], initialFailures: [] })
    ).toEqual({ minutes: 0, unaffected: ['only'] });
  });

  it('does not spread diagonally', () => {
    const input: OutageInput = {
      grid: [
        ['a', null],
        [null, 'b'],
      ],
      initialFailures: ['a'],
    };
    expect(outageSpread(input)).toEqual({ minutes: 0, unaffected: ['b'] });
  });

  it('does not double-count when frontiers meet (implicit cycle safety)', () => {
    const input: OutageInput = {
      grid: [
        ['a', 'b'],
        ['c', 'd'],
      ],
      initialFailures: ['a', 'd'],
    };
    // b and c both fail at minute 1; the ring must not loop forever
    expect(outageSpread(input)).toEqual({ minutes: 1, unaffected: [] });
  });

  it('sorts unaffected ids alphabetically', () => {
    const input: OutageInput = {
      grid: [['x', null, 'm', 'a']],
      initialFailures: ['x'],
    };
    expect(outageSpread(input)).toEqual({
      minutes: 0,
      unaffected: ['a', 'm'],
    });
  });

  it('handles disconnected server regions', () => {
    const input: OutageInput = {
      grid: [
        ['a', 'b', null, 'p', 'q'],
        ['c', 'd', null, 'r', 's'],
      ],
      initialFailures: ['a'],
    };
    const result = outageSpread(input);
    expect(result.minutes).toBe(2); // a → b,c (1) → d (2)
    expect(result.unaffected).toEqual(['p', 'q', 'r', 's']);
  });

  it('computes the exact wave depth on a 200x200 grid from one corner', () => {
    const size = 200;
    const grid: (string | null)[][] = [];
    for (let r = 0; r < size; r++) {
      const row: (string | null)[] = [];
      for (let c = 0; c < size; c++) {
        row.push(`s-${r}-${c}`);
      }
      grid.push(row);
    }
    const result = outageSpread({ grid, initialFailures: ['s-0-0'] });
    expect(result.minutes).toBe(2 * (size - 1)); // manhattan distance to far corner
    expect(result.unaffected).toEqual([]);
  });
});

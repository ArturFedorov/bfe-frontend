import { recalcOrder, DependencyGraph } from './spreadsheet_recalc';

/** Reference computation of the affected set: transitive dependents of `changed`. */
function affectedSet(sheet: DependencyGraph, changed: string): Set<string> {
  const dependents = new Map<string, string[]>();
  for (const [cell, deps] of Object.entries(sheet)) {
    for (const dep of deps) {
      if (!dependents.has(dep)) {
        dependents.set(dep, []);
      }
      dependents.get(dep)!.push(cell);
    }
  }
  const seen = new Set<string>();
  const queue = [...(dependents.get(changed) ?? [])];
  while (queue.length > 0) {
    const cell = queue.shift()!;
    if (seen.has(cell)) {
      continue;
    }
    seen.add(cell);
    queue.push(...(dependents.get(cell) ?? []));
  }
  seen.delete(changed);
  return seen;
}

function expectValidRecalc(
  result: string[],
  sheet: DependencyGraph,
  changed: string,
): void {
  const expected = affectedSet(sheet, changed);
  expect(new Set(result)).toEqual(expected);
  expect(result).toHaveLength(expected.size);
  expect(result).not.toContain(changed);
  const pos = new Map<string, number>();
  result.forEach((cell, i) => pos.set(cell, i));
  for (const cell of result) {
    for (const dep of sheet[cell]) {
      if (pos.has(dep)) {
        expect(pos.get(dep)!).toBeLessThan(pos.get(cell)!);
      }
    }
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Layered sheet, 100 layers x 100 cells: r{L}c{C} reads r{L-1}c{C} and r{L-1}c00,
 * so editing r00c00 affects every cell in layers 1..99 (9900 cells).
 */
function buildLayeredSheet(): DependencyGraph {
  const sheet: DependencyGraph = {};
  for (let layer = 0; layer < 100; layer++) {
    for (let col = 0; col < 100; col++) {
      const id = `r${pad2(layer)}c${pad2(col)}`;
      if (layer === 0) {
        sheet[id] = [];
      } else {
        const deps = [`r${pad2(layer - 1)}c${pad2(col)}`];
        if (col !== 0) {
          deps.push(`r${pad2(layer - 1)}c00`);
        }
        sheet[id] = deps;
      }
    }
  }
  return sheet;
}

describe('recalcOrder', () => {
  it('recomputes a linear chain of dependents in order', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'], c: ['b'], d: ['c'] };
    expect(recalcOrder(sheet, 'a')).toEqual(['b', 'c', 'd']);
  });

  it('recomputes only downstream cells when a mid-chain cell changes', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'], c: ['b'], d: ['c'] };
    expect(recalcOrder(sheet, 'c')).toEqual(['d']);
  });

  it('handles diamond dependencies (shared reader recomputed once, last)', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'], c: ['a'], d: ['b', 'c'] };
    const result = recalcOrder(sheet, 'a');
    expectValidRecalc(result, sheet, 'a');
    expect(result[result.length - 1]).toBe('d');
  });

  it('excludes cells that are not downstream of the edit', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'], c: ['a'], d: ['b', 'c'] };
    // editing b affects only d — a and c are untouched
    expect(recalcOrder(sheet, 'b')).toEqual(['d']);
  });

  it('ignores disconnected parts of the sheet', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'], x: [], y: ['x'] };
    expect(recalcOrder(sheet, 'a')).toEqual(['b']);
    expect(recalcOrder(sheet, 'x')).toEqual(['y']);
  });

  it('returns [] when nothing reads the changed cell', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'] };
    expect(recalcOrder(sheet, 'b')).toEqual([]);
  });

  it('returns [] for an unknown cell id', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'] };
    expect(recalcOrder(sheet, 'ghost')).toEqual([]);
  });

  it('returns [] for an empty sheet', () => {
    expect(recalcOrder({}, 'a')).toEqual([]);
  });

  it('does not mutate the input sheet', () => {
    const sheet: DependencyGraph = { a: [], b: ['a'], c: ['b'] };
    const snapshot = JSON.parse(JSON.stringify(sheet));
    recalcOrder(sheet, 'a');
    expect(sheet).toEqual(snapshot);
  });

  describe('circular references', () => {
    it('throws when the changed cell reads itself', () => {
      expect(() => recalcOrder({ a: ['a'] }, 'a')).toThrow();
    });

    it('throws on a two-cell cycle touching the edit', () => {
      expect(() => recalcOrder({ a: ['b'], b: ['a'] }, 'a')).toThrow();
    });

    it('throws on a longer cycle downstream of the edit', () => {
      const sheet: DependencyGraph = {
        edit: [],
        p: ['edit', 'r'],
        q: ['p'],
        r: ['q'],
      };
      expect(() => recalcOrder(sheet, 'edit')).toThrow();
    });

    it('does NOT throw for a cycle the edit never touches', () => {
      const sheet: DependencyGraph = { a: [], b: ['a'], x: ['y'], y: ['x'] };
      expect(recalcOrder(sheet, 'a')).toEqual(['b']);
    });
  });

  describe('large input', () => {
    it('recomputes 9900 affected cells of a 10k-cell sheet in valid order', () => {
      const sheet = buildLayeredSheet();
      const result = recalcOrder(sheet, 'r00c00');
      expect(result).toHaveLength(9900);
      expectValidRecalc(result, sheet, 'r00c00');
    });

    it('recomputes a single column when a non-hub cell changes', () => {
      const sheet = buildLayeredSheet();
      const result = recalcOrder(sheet, 'r00c50');
      expect(result).toHaveLength(99);
      expectValidRecalc(result, sheet, 'r00c50');
    });
  });
});

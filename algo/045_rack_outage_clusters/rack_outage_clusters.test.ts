import { countOutageClusters, MachineStatus } from './rack_outage_clusters';

function fromStrings(rows: string[]): MachineStatus[][] {
  // 'F' = failed, '.' = ok
  return rows.map((row) =>
    row.split('').map((ch): MachineStatus => (ch === 'F' ? 'failed' : 'ok'))
  );
}

describe('countOutageClusters', () => {
  it('counts separate clusters in a small grid', () => {
    const grid = fromStrings([
      'F.F',
      'F..',
      '..F',
    ]);
    expect(countOutageClusters(grid)).toBe(3);
  });

  it('counts one cluster when all machines failed', () => {
    const grid = fromStrings([
      'FF',
      'FF',
    ]);
    expect(countOutageClusters(grid)).toBe(1);
  });

  it('returns 0 for an all-ok grid', () => {
    const grid = fromStrings([
      '...',
      '...',
    ]);
    expect(countOutageClusters(grid)).toBe(0);
  });

  it('returns 0 for an empty grid', () => {
    expect(countOutageClusters([])).toBe(0);
    expect(countOutageClusters([[]])).toBe(0);
  });

  it('counts a single failed machine as one cluster', () => {
    expect(countOutageClusters(fromStrings(['F']))).toBe(1);
    expect(countOutageClusters(fromStrings(['.']))).toBe(0);
  });

  it('does not connect diagonal neighbors', () => {
    const grid = fromStrings([
      'F.',
      '.F',
    ]);
    expect(countOutageClusters(grid)).toBe(2);
  });

  it('follows snake-shaped clusters through corners', () => {
    const grid = fromStrings([
      'FFFFF',
      '....F',
      'FFFFF',
      'F....',
      'FFFFF',
    ]);
    expect(countOutageClusters(grid)).toBe(1);
  });

  it('handles a ring cluster with an ok hole (cycle in the implicit graph)', () => {
    const grid = fromStrings([
      'FFF',
      'F.F',
      'FFF',
    ]);
    expect(countOutageClusters(grid)).toBe(1);
  });

  it('handles single-row and single-column grids', () => {
    expect(countOutageClusters(fromStrings(['F.F.F']))).toBe(3);
    expect(countOutageClusters(fromStrings(['F', 'F', '.', 'F']))).toBe(2);
  });

  it('counts a 200x200 checkerboard in linear time', () => {
    const size = 200;
    const grid: MachineStatus[][] = [];
    for (let r = 0; r < size; r++) {
      const row: MachineStatus[] = [];
      for (let c = 0; c < size; c++) {
        row.push((r + c) % 2 === 0 ? 'failed' : 'ok');
      }
      grid.push(row);
    }
    // every failed cell is isolated 4-directionally
    expect(countOutageClusters(grid)).toBe((size * size) / 2);
  });

  it('handles a 200x200 fully failed grid without stack overflow', () => {
    const size = 200;
    const grid: MachineStatus[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, (): MachineStatus => 'failed')
    );
    expect(countOutageClusters(grid)).toBe(1);
  });
});

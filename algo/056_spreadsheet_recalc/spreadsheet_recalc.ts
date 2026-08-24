export type DependencyGraph = Record<string, string[]>;

/**
 * Given a sheet mapping each cell to the cells its formula reads, and the id of
 * a changed cell, returns ONLY the affected cells (transitive dependents of the
 * changed cell, excluding the changed cell itself) in a valid recompute order:
 * every affected cell appears after every affected cell it reads from.
 * Throws an Error if a circular reference involves the affected cells.
 */
export function recalcOrder(sheet: DependencyGraph, changed: string): string[] {
  const readers = new Map<string, string[]>();
  for (const [cell, reads] of Object.entries(sheet)) {
    for (const dep of reads) {
      const list = readers.get(dep);
      if (list) list.push(cell);
      else readers.set(dep, [cell]);
    }
  }

  const affected = new Set<string>();
  const queue: string[] = [changed];

  for (let i = 0; i < queue.length; i++) {
    for (const reader of readers.get(queue[i]) ?? []) {
      affected.add(reader);
      queue.push(reader);
    }
  }

  const subgraph = new Set(affected);
  subgraph.add(changed);

  const order: string[] = [];
  const colors = new Map<string, 'gray' | 'black'>();

  const visit = (cell: string): void => {
    const color = colors.get(cell);
    if (color === 'black') return;
    if (color === 'gray') {
      throw new Error(`Cycle dependency is detected with ${cell}`);
    }

    colors.set(cell, 'gray');

    for (const dep of sheet[cell] ?? []) {
      if (subgraph.has(dep)) visit(dep);
    }

    colors.set(cell, 'black');
    if (cell !== changed) order.push(cell);
  };

  for (const cell of affected) visit(cell);

  return order;
}

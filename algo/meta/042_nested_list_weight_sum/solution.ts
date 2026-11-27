export type NestedList = Array<number | NestedList>;

/** Returns the sum of every integer multiplied by its nesting depth (top level = 1). */
export function depthSum(nestedList: NestedList): number {
  // BFS level by level: every integer on level d contributes value * d.
  let total = 0;
  let depth = 1;
  let level: NestedList = nestedList;
  while (level.length > 0) {
    const next: NestedList = [];
    for (const item of level) {
      if (typeof item === 'number') {
        total += item * depth;
      } else {
        next.push(...item);
      }
    }
    level = next;
    depth++;
  }
  return total;
}

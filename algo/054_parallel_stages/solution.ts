export type DependencyGraph = Record<string, string[]>;

/**
 * Groups build targets into stages where every target in a stage can build
 * concurrently: a target's stage is 1 + the max stage of its dependencies.
 * Each stage is sorted alphabetically for determinism.
 * Throws an Error if the graph contains a cycle.
 */
export function parallelStages(graph: DependencyGraph): string[][] {
  const pending = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const target of Object.keys(graph)) {
    pending.set(target, 0);
    dependents.set(target, []);
  }
  for (const [target, deps] of Object.entries(graph)) {
    for (const dep of new Set(deps)) {
      pending.set(target, pending.get(target)! + 1);
      dependents.get(dep)!.push(target);
    }
  }

  // Level-based Kahn: each frontier of zero-in-degree targets is one stage.
  const stages: string[][] = [];
  let stage = [...pending.keys()].filter((t) => pending.get(t) === 0);
  let placed = 0;

  while (stage.length > 0) {
    stages.push(stage.sort());
    placed += stage.length;

    const next: string[] = [];
    for (const target of stage) {
      for (const dependent of dependents.get(target)!) {
        const remaining = pending.get(dependent)! - 1;
        pending.set(dependent, remaining);
        if (remaining === 0) next.push(dependent);
      }
    }
    stage = next;
  }

  if (placed !== pending.size) throw new Error('Dependency cycle detected');

  return stages;
}

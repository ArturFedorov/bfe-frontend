export interface TaskDef {
  name: string;
  deps: string[];
}

/**
 * Given task definitions with dependencies, return a valid execution order
 * (topological sort) where every dependency runs before the task that needs it.
 * Throw on a cyclic dependency.
 */
export function resolveOrder(tasks: TaskDef[]): string[] {
  const graph = new Map<string, string[]>();

  for (const task of tasks) {
    graph.set(task.name, task.deps);
  }

  const result: string[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(name: string) {
    if (inStack.has(name)) {
      throw new Error('Cycle detected');
    }

    if (visited.has(name)) return;

    inStack.add(name);
    visited.add(name);

    for (const dep of graph.get(name) || []) {
      dfs(dep);
    }

    inStack.delete(name);
    result.push(name);
  }

  for (const task of tasks) {
    dfs(task.name);
  }

  return result;
}

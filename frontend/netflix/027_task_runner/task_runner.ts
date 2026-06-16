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
  // TODO: implement
  throw new Error('Not implemented');
}

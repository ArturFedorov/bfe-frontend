/**
 * A tiny bundler over an in-memory module map.
 * Each module declares its dependencies and a body. Starting from `entry`,
 * resolve the dependency graph and produce an ordered list of module ids such
 * that every dependency appears before the module that imports it
 * (topological order). Throw on a dependency cycle.
 */
export interface Module {
  id: string;
  deps: string[];
}

export function bundleOrder(
  modules: Record<string, Module>,
  entry: string,
): string[] {
  // TODO: implement
  throw new Error('Not implemented');
}

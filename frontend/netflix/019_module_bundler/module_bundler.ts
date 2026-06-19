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
  const result: string[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string) {
    if(inStack.has(id)) {
      throw new Error(`Cycle detected: ${id}`);
    }

    if(visited.has(id)) return;

    inStack.add(id);

    const mod = modules[id];

    if(!mod) throw new Error(`Module ${id} not found`);

    for(const dep of mod.deps) {
      dfs(dep);
    }

    inStack.delete(id);
    visited.add(id);
    result.push(id);
  }

  dfs(entry);
  return result;
}

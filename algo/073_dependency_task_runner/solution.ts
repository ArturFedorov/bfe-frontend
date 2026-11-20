/**
 * 073. Dependency Task Runner — reference solution
 *
 * Validate first (unknown ids, cycles via Kahn's algorithm) so a bad graph
 * throws synchronously before anything runs. Then schedule eagerly: keep a
 * ready queue of tasks whose deps have all fulfilled, and every time a task
 * settles, unlock its dependents and pump the queue up to `concurrency`.
 * A rejection marks every transitive dependent as skipped.
 *
 * Time: O(V + E). Space: O(V + E).
 */
export interface TaskDef {
  /** Unique task id. */
  id: string;
  /** Ids of tasks that must fulfill before this task may start. */
  deps: string[];
  /** The async work for this task. */
  run: () => Promise<unknown>;
}

export type TaskStatus = 'fulfilled' | 'rejected' | 'skipped';

export function runTaskGraph(
  tasks: TaskDef[],
  concurrency: number,
): Promise<Record<string, TaskStatus>> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer');
  }

  const byId = new Map<string, TaskDef>();
  for (const task of tasks) {
    if (byId.has(task.id)) {
      throw new Error(`Duplicate task id "${task.id}"`);
    }
    byId.set(task.id, task);
  }

  const dependents = new Map<string, string[]>();
  const remaining = new Map<string, number>();
  for (const task of tasks) {
    dependents.set(task.id, []);
    remaining.set(task.id, task.deps.length);
  }
  for (const task of tasks) {
    for (const dep of task.deps) {
      if (!byId.has(dep)) {
        throw new Error(`Task "${task.id}" depends on unknown task "${dep}"`);
      }
      dependents.get(dep)!.push(task.id);
    }
  }

  assertAcyclic(tasks, dependents, remaining);

  return new Promise((resolve) => {
    const statuses = new Map<string, TaskStatus>();
    const ready = tasks.filter((t) => t.deps.length === 0).map((t) => t.id);
    let head = 0;
    let running = 0;

    const finishIfDone = (): void => {
      if (statuses.size === tasks.length) {
        const result: Record<string, TaskStatus> = {};
        for (const task of tasks) result[task.id] = statuses.get(task.id)!;
        resolve(result);
      }
    };

    const skipDependents = (id: string): void => {
      const stack = [...dependents.get(id)!];
      while (stack.length > 0) {
        const next = stack.pop()!;
        if (statuses.has(next)) continue;
        statuses.set(next, 'skipped');
        stack.push(...dependents.get(next)!);
      }
    };

    const settle = (id: string, status: TaskStatus): void => {
      running--;
      statuses.set(id, status);
      if (status === 'fulfilled') {
        for (const child of dependents.get(id)!) {
          const left = remaining.get(child)! - 1;
          remaining.set(child, left);
          if (left === 0 && !statuses.has(child)) ready.push(child);
        }
      } else {
        skipDependents(id);
      }
      pump();
      finishIfDone();
    };

    const start = (id: string): void => {
      running++;
      let promise: Promise<unknown>;
      try {
        promise = Promise.resolve(byId.get(id)!.run());
      } catch (error) {
        promise = Promise.reject(error);
      }
      promise.then(
        () => settle(id, 'fulfilled'),
        () => settle(id, 'rejected'),
      );
    };

    function pump(): void {
      while (running < concurrency && head < ready.length) {
        start(ready[head++]);
      }
    }

    pump();
    finishIfDone();
  });
}

function assertAcyclic(
  tasks: TaskDef[],
  dependents: Map<string, string[]>,
  remaining: Map<string, number>,
): void {
  const indegree = new Map(remaining);
  const queue = tasks.filter((t) => t.deps.length === 0).map((t) => t.id);
  let visited = 0;
  for (let i = 0; i < queue.length; i++) {
    visited++;
    for (const child of dependents.get(queue[i])!) {
      const left = indegree.get(child)! - 1;
      indegree.set(child, left);
      if (left === 0) queue.push(child);
    }
  }
  if (visited !== tasks.length) {
    throw new Error('Task graph contains a cycle');
  }
}

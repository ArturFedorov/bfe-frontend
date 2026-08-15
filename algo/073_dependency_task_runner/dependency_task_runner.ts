export interface TaskDef {
  /** Unique task id. */
  id: string;
  /** Ids of tasks that must fulfill before this task may start. */
  deps: string[];
  /** The async work for this task. */
  run: () => Promise<unknown>;
}

export type TaskStatus = 'fulfilled' | 'rejected' | 'skipped';

/**
 * Runs a dependency graph of async tasks with at most `concurrency` in
 * flight. Throws synchronously on cycles or unknown dependency ids.
 * Resolves with a status for every task id.
 */
export function runTaskGraph(
  tasks: TaskDef[],
  concurrency: number
): Promise<Record<string, TaskStatus>> {
  // TODO: implement
  throw new Error('Not implemented');
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

/**
 * Rearranges the task list in place: all active tasks first (keeping their
 * original relative order), followed by all completed tasks (any order).
 *
 * Mutates the given array; returns nothing.
 *
 * @param tasks - the task list to partition in place
 */
export function archiveCompleted(tasks: Task[]): void {
  // TODO: implement
  throw new Error('Not implemented');
}

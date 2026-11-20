export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

export function archiveCompleted(tasks: Task[]): void {
  // Write pointer marks the next active slot; swapping sends completed tasks back.
  let write = 0;

  for (let read = 0; read < tasks.length; read++) {
    if (tasks[read].completed) continue;

    if (read !== write) {
      [tasks[write], tasks[read]] = [tasks[read], tasks[write]];
    }
    write++;
  }
}

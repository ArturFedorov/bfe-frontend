import { archiveCompleted, Task } from './archive_completed';

const task = (id: number, completed: boolean): Task => ({
  id,
  title: `task-${id}`,
  completed,
});

const activeIds = (tasks: Task[]): number[] =>
  tasks.filter((t) => !t.completed).map((t) => t.id);

describe('archiveCompleted', () => {
  it('moves completed tasks to the end and keeps active order', () => {
    const tasks = [
      task(1, true),
      task(2, false),
      task(3, true),
      task(4, false),
    ];
    archiveCompleted(tasks);
    expect(tasks).toHaveLength(4);
    expect(tasks[0].id).toBe(2);
    expect(tasks[1].id).toBe(4);
    expect(tasks.slice(2).map((t) => t.completed)).toEqual([true, true]);
    expect(
      tasks
        .slice(2)
        .map((t) => t.id)
        .sort((a, b) => a - b),
    ).toEqual([1, 3]);
  });

  it('mutates the same array reference in place', () => {
    const tasks = [task(1, true), task(2, false)];
    const ref = tasks;
    archiveCompleted(tasks);
    expect(ref).toBe(tasks);
    expect(ref[0].id).toBe(2);
    expect(ref[1].id).toBe(1);
  });

  it('leaves an empty list empty', () => {
    const tasks: Task[] = [];
    archiveCompleted(tasks);
    expect(tasks).toEqual([]);
  });

  it('handles a single active task', () => {
    const tasks = [task(1, false)];
    archiveCompleted(tasks);
    expect(tasks.map((t) => t.id)).toEqual([1]);
  });

  it('handles a single completed task', () => {
    const tasks = [task(1, true)];
    archiveCompleted(tasks);
    expect(tasks.map((t) => t.id)).toEqual([1]);
  });

  it('leaves an all-active list in its original order', () => {
    const tasks = [task(3, false), task(1, false), task(2, false)];
    archiveCompleted(tasks);
    expect(tasks.map((t) => t.id)).toEqual([3, 1, 2]);
  });

  it('keeps an all-completed list intact as a set', () => {
    const tasks = [task(1, true), task(2, true), task(3, true)];
    archiveCompleted(tasks);
    expect(tasks.map((t) => t.id).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(tasks.every((t) => t.completed)).toBe(true);
  });

  it('preserves active order when completed tasks lead the list', () => {
    const tasks = [
      task(9, true),
      task(8, true),
      task(5, false),
      task(7, false),
      task(6, false),
    ];
    archiveCompleted(tasks);
    expect(activeIds(tasks.slice(0, 3))).toEqual([5, 7, 6]);
    expect(tasks.slice(3).every((t) => t.completed)).toBe(true);
  });

  it('does not lose or duplicate any task objects', () => {
    const tasks = [
      task(1, true),
      task(2, false),
      task(3, true),
      task(4, false),
      task(5, true),
    ];
    const before = new Set(tasks);
    archiveCompleted(tasks);
    expect(tasks).toHaveLength(5);
    expect(new Set(tasks)).toEqual(before);
  });

  it('partitions 200_000 alternating tasks in linear time', () => {
    const n = 200_000;
    const tasks: Task[] = [];
    for (let i = 0; i < n; i++) {
      tasks.push(task(i, i % 2 === 0)); // even ids completed, odd ids active
    }
    archiveCompleted(tasks);
    expect(tasks).toHaveLength(n);
    const half = n / 2;
    for (let i = 0; i < half; i++) {
      expect(tasks[i].completed).toBe(false);
      expect(tasks[i].id).toBe(i * 2 + 1); // active order preserved: 1, 3, 5, ...
    }
    for (let i = half; i < n; i++) {
      expect(tasks[i].completed).toBe(true);
    }
  });
});

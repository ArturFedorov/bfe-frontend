import { resolveOrder, TaskDef } from './task_runner';

const tasks: TaskDef[] = [
  { name: 'build', deps: ['clean', 'compile'] },
  { name: 'compile', deps: ['clean'] },
  { name: 'clean', deps: [] },
];

describe('resolveOrder', () => {
  it('runs dependencies first', () => {
    const order = resolveOrder(tasks);
    expect(order.indexOf('clean')).toBeLessThan(order.indexOf('compile'));
    expect(order.indexOf('compile')).toBeLessThan(order.indexOf('build'));
  });

  it('throws on cyclic dependencies', () => {
    const cyclic: TaskDef[] = [
      { name: 'a', deps: ['b'] },
      { name: 'b', deps: ['a'] },
    ];
    expect(() => resolveOrder(cyclic)).toThrow();
  });

  // Helper: assert that `order` is a valid topological order for `defs`.
  const assertValidOrder = (defs: TaskDef[], order: string[]) => {
    expect(order).toHaveLength(defs.length);
    expect(new Set(order).size).toBe(order.length);
    for (const task of defs) {
      for (const dep of task.deps) {
        expect(order.indexOf(dep)).toBeGreaterThanOrEqual(0);
        expect(order.indexOf(dep)).toBeLessThan(order.indexOf(task.name));
      }
    }
  };

  it('produces a valid order for the sample tasks', () => {
    assertValidOrder(tasks, resolveOrder(tasks));
  });

  it('matches the README example', () => {
    const defs: TaskDef[] = [
      { name: 'build', deps: ['compile'] },
      { name: 'compile', deps: [] },
    ];
    expect(resolveOrder(defs)).toEqual(['compile', 'build']);
  });

  it('handles a single task with no dependencies', () => {
    expect(resolveOrder([{ name: 'solo', deps: [] }])).toEqual(['solo']);
  });

  it('returns an empty array for no tasks', () => {
    expect(resolveOrder([])).toEqual([]);
  });

  it('includes every task exactly once', () => {
    const order = resolveOrder(tasks);
    expect(order.slice().sort()).toEqual(['build', 'clean', 'compile']);
  });

  it('handles independent tasks with no dependencies', () => {
    const defs: TaskDef[] = [
      { name: 'a', deps: [] },
      { name: 'b', deps: [] },
      { name: 'c', deps: [] },
    ];
    assertValidOrder(defs, resolveOrder(defs));
  });

  it('orders a diamond dependency graph', () => {
    const diamond: TaskDef[] = [
      { name: 'top', deps: ['left', 'right'] },
      { name: 'left', deps: ['base'] },
      { name: 'right', deps: ['base'] },
      { name: 'base', deps: [] },
    ];
    assertValidOrder(diamond, resolveOrder(diamond));
  });

  it('orders a shared dependency used by multiple tasks', () => {
    const defs: TaskDef[] = [
      { name: 'lint', deps: ['install'] },
      { name: 'test', deps: ['install', 'lint'] },
      { name: 'install', deps: [] },
    ];
    assertValidOrder(defs, resolveOrder(defs));
  });

  it('throws on a self-referential task', () => {
    expect(() => resolveOrder([{ name: 'a', deps: ['a'] }])).toThrow();
  });

  it('throws on a longer cycle', () => {
    const cyclic: TaskDef[] = [
      { name: 'a', deps: ['b'] },
      { name: 'b', deps: ['c'] },
      { name: 'c', deps: ['a'] },
    ];
    expect(() => resolveOrder(cyclic)).toThrow();
  });

  it('does not mutate the input task definitions', () => {
    const input: TaskDef[] = [
      { name: 'build', deps: ['compile'] },
      { name: 'compile', deps: [] },
    ];
    const snapshot = JSON.parse(JSON.stringify(input));
    resolveOrder(input);
    expect(input).toEqual(snapshot);
  });
});

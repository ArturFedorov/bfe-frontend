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
});

import { bundleOrder, Module } from './module_bundler';

const modules: Record<string, Module> = {
  entry: { id: 'entry', deps: ['a', 'b'] },
  a: { id: 'a', deps: ['c'] },
  b: { id: 'b', deps: ['c'] },
  c: { id: 'c', deps: [] },
};

describe('bundleOrder', () => {
  it('orders dependencies before dependents', () => {
    const order = bundleOrder(modules, 'entry');
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('a'));
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('entry'));
    expect(order[order.length - 1]).toBe('entry');
  });

  it('throws on a cycle', () => {
    const cyclic: Record<string, Module> = {
      a: { id: 'a', deps: ['b'] },
      b: { id: 'b', deps: ['a'] },
    };
    expect(() => bundleOrder(cyclic, 'a')).toThrow();
  });
});

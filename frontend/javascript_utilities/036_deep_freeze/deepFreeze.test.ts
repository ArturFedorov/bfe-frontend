import { deepFreeze } from './deepFreeze';

describe('deepFreeze', () => {
  test('should return the same reference', () => {
    const input = { a: 1 };

    expect(deepFreeze(input)).toBe(input);
  });

  test('should freeze the top level', () => {
    const frozen = deepFreeze({ a: 1 });

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(() => {
      (frozen as any).a = 2;
    }).toThrow(TypeError);
  });

  test('should freeze nested objects so assignment throws in strict mode', () => {
    const frozen = deepFreeze({ api: { url: 'x', retries: 3 } });

    expect(Object.isFrozen(frozen.api)).toBe(true);
    expect(() => {
      (frozen.api as any).retries = 5;
    }).toThrow(TypeError);
    expect(frozen.api.retries).toBe(3);
  });

  test('should freeze arrays and the objects inside them', () => {
    const frozen = deepFreeze({ list: [{ id: 1 }, { id: 2 }] });

    expect(Object.isFrozen(frozen.list)).toBe(true);
    expect(Object.isFrozen(frozen.list[0])).toBe(true);
    expect(() => (frozen.list as any).push({ id: 3 })).toThrow(TypeError);
    expect(() => {
      (frozen.list[1] as any).id = 9;
    }).toThrow(TypeError);
  });

  test('should report Object.isFrozen true at every depth', () => {
    const frozen = deepFreeze({ a: { b: { c: { d: [1, { e: 1 }] } } } });

    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.a.b)).toBe(true);
    expect(Object.isFrozen(frozen.a.b.c)).toBe(true);
    expect(Object.isFrozen(frozen.a.b.c.d)).toBe(true);
    expect(Object.isFrozen(frozen.a.b.c.d[1])).toBe(true);
  });

  test('should terminate on cyclic graphs', () => {
    const node: any = { name: 'root', children: [] };
    node.self = node;
    node.children.push({ parent: node });

    expect(() => deepFreeze(node)).not.toThrow();
    expect(Object.isFrozen(node)).toBe(true);
    expect(Object.isFrozen(node.children[0])).toBe(true);
  });

  test('should return primitives and null untouched', () => {
    expect(deepFreeze(5)).toBe(5);
    expect(deepFreeze('s')).toBe('s');
    expect(deepFreeze(null)).toBeNull();
    expect(deepFreeze(undefined)).toBeUndefined();
  });

  test('should leave Date, Map and Set usable', () => {
    const frozen = deepFreeze({
      when: new Date(2020, 0, 1),
      cache: new Map<string, number>(),
      ids: new Set<number>(),
    });

    frozen.cache.set('k', 1);
    frozen.ids.add(2);
    frozen.when.setFullYear(2021);

    expect(frozen.cache.get('k')).toBe(1);
    expect(frozen.ids.has(2)).toBe(true);
    expect(frozen.when.getFullYear()).toBe(2021);
  });

  test('should be idempotent on already-frozen input', () => {
    const once = deepFreeze({ a: { b: 1 } });

    expect(deepFreeze(once)).toBe(once);
    expect(Object.isFrozen(once.a)).toBe(true);
  });

  test('should leave methods callable', () => {
    const frozen = deepFreeze({
      count: 1,
      next() {
        return this.count + 1;
      },
    });

    expect(frozen.next()).toBe(2);
  });

  test('should expose a Readonly type', () => {
    const frozen = deepFreeze({ a: 1 });

    // @ts-expect-error: properties of a Readonly<T> cannot be assigned
    const assign = () => (frozen.a = 2);

    expect(assign).toThrow(TypeError);
  });
});

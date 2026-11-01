import { Builder } from './type_safe_builder';

describe('Builder', () => {
  it('accumulates values through chained set calls', () => {
    const result = new Builder().set('name', 'ada').set('age', 36).build();
    // Types should be inferred precisely:
    const name: string = result.name;
    const age: number = result.age;
    expect(name).toBe('ada');
    expect(age).toBe(36);
    expect(result).toEqual({ name: 'ada', age: 36 });
  });

  it('returns an empty object when nothing was set', () => {
    const result = new Builder().build();
    expect(result).toEqual({});
  });

  it('accumulates a single key', () => {
    const result = new Builder().set('id', 1).build();
    const id: number = result.id;
    expect(id).toBe(1);
    expect(result).toEqual({ id: 1 });
  });

  it('accumulates keys through many chained calls', () => {
    const result = new Builder()
      .set('a', 1)
      .set('b', 'two')
      .set('c', true)
      .set('d', [1, 2, 3])
      .build();
    expect(result).toEqual({ a: 1, b: 'two', c: true, d: [1, 2, 3] });
  });

  it('lets a later set() overwrite an earlier value for the same key', () => {
    const result = new Builder().set('x', 1).set('x', 2).build();
    expect(result.x).toBe(2);
  });

  it('updates the tracked type when the same key is set with a new value type', () => {
    const result = new Builder().set('x', 1).set('x', 'now a string').build();
    const x: string = result.x;
    expect(x).toBe('now a string');
  });

  it('does not allow accessing a key that was never set', () => {
    const result = new Builder().set('name', 'ada').build();
    // @ts-expect-error 'age' was never set on this builder
    result.age;
  });

  it('accepts object and array values', () => {
    const result = new Builder()
      .set('meta', { nested: true })
      .set('tags', ['a', 'b'])
      .build();
    expect(result.meta).toEqual({ nested: true });
    expect(result.tags).toEqual(['a', 'b']);
  });
});

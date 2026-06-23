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
});

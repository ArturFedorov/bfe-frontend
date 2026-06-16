import { validate, Schema } from './schema_validator';

const schema: Schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name', 'age'],
};

describe('validate', () => {
  it('accepts a valid object', () => {
    expect(validate({ name: 'Ada', age: 36 }, schema)).toEqual([]);
  });

  it('reports type mismatches with a path', () => {
    const errors = validate({ name: 'Ada', age: 'old' }, schema);
    expect(errors).toEqual([
      { path: 'age', message: expect.stringContaining('number') },
    ]);
  });

  it('reports missing required fields', () => {
    const errors = validate({ name: 'Ada' }, schema);
    expect(errors.map((e) => e.path)).toContain('age');
  });
});

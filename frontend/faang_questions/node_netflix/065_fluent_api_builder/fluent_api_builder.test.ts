import { QueryBuilder } from './fluent_api_builder';

describe('QueryBuilder', () => {
  it('builds a query through chained calls', () => {
    const sql = new QueryBuilder()
      .select('id', 'name')
      .from('users')
      .where('age > 18')
      .orderBy('name', 'ASC')
      .build();
    expect(sql).toBe(
      'SELECT id, name FROM users WHERE age > 18 ORDER BY name ASC',
    );
  });

  it('defaults orderBy direction to ASC', () => {
    const sql = new QueryBuilder().select('id').from('t').orderBy('id').build();
    expect(sql).toBe('SELECT id FROM t ORDER BY id ASC');
  });

  it('supports DESC ordering', () => {
    const sql = new QueryBuilder()
      .select('id')
      .from('t')
      .orderBy('created', 'DESC')
      .build();
    expect(sql).toBe('SELECT id FROM t ORDER BY created DESC');
  });

  it('returns the same builder instance from each method for chaining', () => {
    const qb = new QueryBuilder();
    expect(qb.select('id')).toBe(qb);
    expect(qb.from('t')).toBe(qb);
    expect(qb.where('id > 0')).toBe(qb);
    expect(qb.orderBy('id')).toBe(qb);
  });

  it('builds a query with only select and from', () => {
    const sql = new QueryBuilder().select('id', 'name').from('users').build();
    expect(sql).toBe('SELECT id, name FROM users');
  });

  it('builds a query with a where clause but no ordering', () => {
    const sql = new QueryBuilder()
      .select('*')
      .from('users')
      .where('active = true')
      .build();
    expect(sql).toBe('SELECT * FROM users WHERE active = true');
  });

  it('joins multiple selected columns with a comma and space', () => {
    const sql = new QueryBuilder().select('a', 'b', 'c').from('t').build();
    expect(sql).toBe('SELECT a, b, c FROM t');
  });
});

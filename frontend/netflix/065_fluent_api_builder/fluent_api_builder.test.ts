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
});

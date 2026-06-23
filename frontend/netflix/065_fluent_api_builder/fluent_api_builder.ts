/**
 * A fluent, chainable query builder. Each method returns `this` so calls chain;
 * `build()` assembles a SQL-ish string.
 */
export class QueryBuilder {
  select(...columns: string[]): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  from(table: string): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  where(condition: string): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    // TODO: implement
    throw new Error('Not implemented');
  }

  build(): string {
    // TODO: implement
    throw new Error('Not implemented');
  }
}

/**
 * A fluent, chainable query builder. Each method returns `this` so calls chain;
 * `build()` assembles a SQL-ish string.
 */
export class QueryBuilder {
  private selectPart: string = '';
  private fromPart = '';
  private wherePart = '';
  private orderByPart = '';

  select(...columns: string[]): this {
    const selectors = columns.join(', ');

    this.selectPart = `SELECT ${selectors.trim()}`;
    return this;
  }

  from(table: string): this {
    this.fromPart = `FROM ${table}`.trim();
    return this;
  }

  where(condition: string): this {
    const predicate = this.wherePart.includes('WHERE') ? 'AND' : 'WHERE';
    this.wherePart = `${this.wherePart} ${predicate} ${condition}`.trim();
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByPart = `ORDER BY ${column} ${direction}`.trim();
    return this;
  }

  build(): string {
    const parts = [
      this.selectPart,
      this.fromPart,
      this.wherePart,
      this.orderByPart,
    ].filter(Boolean);
    this.resetData();

    return parts.join(' ');
  }

  private resetData() {
    this.selectPart = '';
    this.orderByPart = '';
    this.fromPart = '';
    this.wherePart = '';
  }
}

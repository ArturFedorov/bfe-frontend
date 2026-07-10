/**
 * A type-safe fluent builder. Each `set` returns a builder whose type tracks the
 * accumulated keys, so `build()` returns a precisely typed object.
 */
export class Builder<T extends object = {}> {
  private data: Record<string, unknown> = {};

  set<K extends string, V>(key: K, value: V): Builder<T & Record<K, V>> {
    this.data[key] = value;
    return this as unknown as Builder<T & Record<K, V>>;
  }

  build(): T {
    return { ...this.data } as T;
  }
}

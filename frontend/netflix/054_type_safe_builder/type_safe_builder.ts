/**
 * A type-safe fluent builder. Each `set` returns a builder whose type tracks the
 * accumulated keys, so `build()` returns a precisely typed object.
 */
export class Builder<T extends object = {}> {
  set<K extends string, V>(key: K, value: V): Builder<T & Record<K, V>> {
    // TODO: implement
    throw new Error('Not implemented');
  }

  build(): T {
    // TODO: implement
    throw new Error('Not implemented');
  }
}

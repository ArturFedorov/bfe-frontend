export type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void,
) => void;

/**
 * A thenable whose executor runs only when the first consumer attaches
 * via .then / .catch / await — and runs exactly once.
 */
export class LazyPromise<T> implements PromiseLike<T> {
  private promise: Promise<T> | null = null;

  constructor(private readonly executor: Executor<T>) {};

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.promise ??= new Promise<T>(this.executor);
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.then(undefined, onrejected);
  }
}

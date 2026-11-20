/**
 * 075. Lazy Promise — reference solution
 *
 * Store the executor and build the real Promise on first consumption. Every
 * consumer (`then`, `catch`, `await`) goes through `then`, which memoizes the
 * underlying promise, so the executor runs exactly once.
 */
export type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void,
) => void;

export class LazyPromise<T> implements PromiseLike<T> {
  private promise: Promise<T> | null = null;

  constructor(private readonly executor: Executor<T>) {}

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

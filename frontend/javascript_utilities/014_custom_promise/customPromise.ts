type Executor<T> = (
  resolve: (value: T) => void,
  reject: (reason?: any) => void,
) => void;

export class MyPromise<T> {
  constructor(executor: Executor<T>) {}
  then<U>(
    onFulfilled?: (value: T) => U | MyPromise<U>,
    onRejected?: (reason: any) => U | MyPromise<U>,
  ): MyPromise<U> {
    return new MyPromise(() => {});
  }
  catch<U>(onRejected: (reason: any) => U | MyPromise<U>): MyPromise<U> {
    return new MyPromise(() => {});
  }
  static resolve<T>(value: T): MyPromise<T> {
    return new MyPromise(() => {});
  }
  static reject(reason: any): MyPromise<never> {
    return new MyPromise(() => {});
  }
}

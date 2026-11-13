type Executor<T> = (
  resolve: (value: T | MyPromise<T>) => void,
  reject: (reason?: any) => void,
) => void;

type State = 'pending' | 'fulfilled' | 'rejected';

type Reaction = () => void;

export class MyPromise<T> {
  private state: State = 'pending';
  private value: T | undefined = undefined;
  private reason: unknown = undefined;
  private reactions: Reaction[] = [];

  private locked = false;

  constructor(executor: Executor<T>) {
    const resolve = (value: T | MyPromise<T>) => this.resolveValue(value);
    const reject = (reason?: unknown) => this.settle('rejected', reason);

    try {
      executor(resolve, reject);
    } catch (err: unknown) {
      reject(err);
    }
  }

  private resolveValue(value: T | MyPromise<T>): void {
    if (this.state !== 'pending' || this.locked) return;
    if (value instanceof MyPromise) {
      this.locked = true;

      value.then(
        (inner) => this.settle('fulfilled', inner),
        (reason) => this.settle('rejected', reason),
      );

      return;
    }

    this.settle('fulfilled', value);
  }

  private settle(state: Exclude<State, 'pending'>, result: unknown): void {
    if (this.state !== 'pending') return;
    this.state = state;
    if (state === 'fulfilled') this.value = result as T;
    else this.reason = result;

    const reactions = this.reactions;
    this.reactions = [];
    reactions.forEach((run) => queueMicrotask(run));
  }

  then<U>(
    onFulfilled?: (value: T) => U | MyPromise<U>,
    onRejected?: (reason: any) => U | MyPromise<U>,
  ): MyPromise<U> {
    return new MyPromise((resolve, reject) => {
      const reaction: Reaction = () => {
        try {
          if (this.state === 'fulfilled') {
            if (!onFulfilled) return resolve(this.value as unknown as U);
            resolve(onFulfilled(this.value as T));
          } else {
            if (!onRejected) return reject(this.reason);
            reject(onRejected(this.reason));
          }
        } catch (err: unknown) {
          reject(err);
        }
      };

      if (this.state === 'pending') this.reactions.push(reaction);
      else queueMicrotask(reaction);
    });
  }
  catch<U>(onRejected: (reason: any) => U | MyPromise<U>): MyPromise<U> {
    return this.then(undefined, onRejected);
  }
  static resolve<T>(value: T): MyPromise<T> {
    return new MyPromise((resolve) => resolve(value));
  }
  static reject(reason: any): MyPromise<never> {
    return new MyPromise((_, reject) => reject(reason));
  }
}

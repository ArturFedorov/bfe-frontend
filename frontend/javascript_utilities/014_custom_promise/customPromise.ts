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
    const resolve = (value: T | MyPromise<T>) => this.resolveWith(value);
    const reject = (reason?: unknown) => this.settle('rejected', reason);

    try {
      executor(resolve, reject);
    } catch (error: unknown) {
      reject(error);
    }
  }

  private resolveWith(value: T | MyPromise<T>): void {
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
            if (!onFulfilled) return resolve(this.value as unknown as U); // pass-through
            resolve(onFulfilled(this.value as T));
          } else {
            if (!onRejected) return reject(this.reason); // propagate down the chain
            resolve(onRejected(this.reason)); // a handled rejection recovers
          }
        } catch (error: unknown) {
          reject(error); // a throwing handler rejects the next promise
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
    return new MyPromise<T>((resolve) => resolve(value));
  }
  static reject(reason: any): MyPromise<never> {
    return new MyPromise<never>((_, reject) => reject(reason));
  }
}

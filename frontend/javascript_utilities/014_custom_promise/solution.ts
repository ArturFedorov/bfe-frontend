/**
 * Reference solution for 014 — keep customPromise.ts as your own attempt;
 * this file is for comparison afterwards.
 */
type Executor<T> = (
  resolve: (value: T | MyPromise<T>) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void,
) => void;

type State = 'pending' | 'fulfilled' | 'rejected';

/** A queued reaction: runs once this promise has settled, always as a microtask. */
type Reaction = () => void;

export class MyPromise<T> {
  private state: State = 'pending';
  private value: T | undefined = undefined;
  private reason: unknown = undefined;
  private reactions: Reaction[] = [];
  /** Set once resolve() received a promise: we are now bound to its outcome. */
  private locked = false;

  constructor(executor: Executor<T>) {
    const resolve = (value: T | MyPromise<T>) => this.resolveWith(value);
    const reject = (reason?: unknown) => this.settle('rejected', reason);
    try {
      executor(resolve, reject);
    } catch (error: unknown) {
      reject(error); // a throwing executor is a rejection, not a crash
    }
  }

  // --- settlement -----------------------------------------------------------

  private resolveWith(value: T | MyPromise<T>): void {
    if (this.state !== 'pending' || this.locked) return;
    if (value instanceof MyPromise) {
      // Adopt the inner promise's eventual state ("assimilation"). Lock so a
      // later plain resolve() cannot pre-empt the outcome we committed to.
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
    if (this.state !== 'pending') return; // first settlement wins, permanently
    this.state = state;
    if (state === 'fulfilled') this.value = result as T;
    else this.reason = result;
    const reactions = this.reactions;
    this.reactions = [];
    reactions.forEach((run) => queueMicrotask(run));
  }

  // --- chaining -------------------------------------------------------------

  then<U = T>(
    onFulfilled?: (value: T) => U | MyPromise<U>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRejected?: (reason: any) => U | MyPromise<U>,
  ): MyPromise<U> {
    return new MyPromise<U>((resolve, reject) => {
      // Captures the NEXT promise's resolve/reject; runs after THIS one settles.
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
      else queueMicrotask(reaction); // already settled: still never synchronous
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch<U = T>(onRejected: (reason: any) => U | MyPromise<U>): MyPromise<U> {
    return this.then(undefined, onRejected);
  }

  // --- statics ----------------------------------------------------------------

  static resolve<T>(value: T | MyPromise<T>): MyPromise<T> {
    return new MyPromise<T>((resolve) => resolve(value));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static reject(reason?: any): MyPromise<never> {
    return new MyPromise<never>((_, reject) => reject(reason));
  }
}

// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { pipe } from './typed_pipe';

type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

const parseChecks = (raw: string): number[] => JSON.parse(raw);
const countPassing = (checks: number[]): number => checks.filter((c) => c > 0).length;
const label = (passing: number): string => `${passing} passing`;
const shout = (text: string): string => text.toUpperCase();

describe('013 typed_pipe — runtime', () => {
  it('composes two functions left to right', () => {
    const passingCount = pipe(parseChecks, countPassing);
    expect(passingCount('[1,0,1,1]')).toBe(3);
  });

  it('composes three functions', () => {
    const healthScore = pipe(parseChecks, countPassing, label);
    expect(healthScore('[1,0,1]')).toBe('2 passing');
  });

  it('composes four functions', () => {
    const loudScore = pipe(parseChecks, countPassing, label, shout);
    expect(loudScore('[0,0,1]')).toBe('1 PASSING');
  });

  it('calls each step exactly once, in order', () => {
    const order: string[] = [];
    const run = pipe(
      (n: number) => {
        order.push('first');
        return n + 1;
      },
      (n: number) => {
        order.push('second');
        return n * 10;
      }
    );
    expect(run(2)).toBe(30);
    expect(order).toEqual(['first', 'second']);
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const two = pipe(parseChecks, countPassing);
  type _TwoStep = Expect<Equal<typeof two, (a: string) => number>>;

  const three = pipe(parseChecks, countPassing, label);
  type _ThreeStep = Expect<Equal<typeof three, (a: string) => string>>;

  const four = pipe(parseChecks, countPassing, label, shout);
  type _FourStep = Expect<Equal<typeof four, (a: string) => string>>;

  const inferred = pipe(
    (s: string) => s.length,
    (n) => n > 0
  );
  type _MiddleParamInferred = Expect<Equal<typeof inferred, (a: string) => boolean>>;

  // @ts-expect-error — number output cannot feed a boolean input
  pipe((s: string) => s.length, (b: boolean) => !b);

  // @ts-expect-error — broken middle link in a 3-step chain
  pipe(parseChecks, label, shout);
};
void _contracts;

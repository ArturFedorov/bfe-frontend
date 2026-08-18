// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import {
  DeliveryResult,
  Payload,
  RetryConfig,
  payloadSize,
  shouldAlert,
  sumDefined,
  unwrap,
} from './narrowing_traps';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// --- Compile-time: the original broken patterns still fail ------------------

function brokenShouldAlert(config: RetryConfig): boolean {
  // @ts-expect-error — number | undefined cannot be compared without a fallback
  return config.retry?.attempts > 3;
}
void brokenShouldAlert;

function brokenPayloadSize(payload: Payload): boolean {
  // @ts-expect-error — text does not exist on the union, so typeof cannot reach it
  return typeof payload.text === 'string';
}
void brokenPayloadSize;

function brokenSumDefined(values: (number | undefined)[]): number {
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] !== undefined) {
      // @ts-expect-error — element access with a mutable index does not narrow
      total += values[i];
    }
  }
  return total;
}
void brokenSumDefined;

function brokenUnwrap(result: DeliveryResult) {
  // @ts-expect-error — value cannot be destructured off the whole union
  const { value } = result;
  return value;
}
void brokenUnwrap;

// --- Compile-time: the fixed narrowing is real -------------------------------

function narrowingProbe(payload: Payload, result: DeliveryResult) {
  if ('text' in payload) {
    type _text = Expect<Equal<typeof payload, { text: string }>>;
  }
  if (result.ok) {
    type _ok = Expect<Equal<typeof result, { ok: true; value: number }>>;
  }
}
void narrowingProbe;

// --- Runtime behavior --------------------------------------------------------

describe('shouldAlert', () => {
  it('alerts above the threshold', () => {
    expect(shouldAlert({ retry: { attempts: 5, backoffMs: 100 } })).toBe(true);
  });

  it('does not alert at or below the threshold', () => {
    expect(shouldAlert({ retry: { attempts: 3, backoffMs: 100 } })).toBe(false);
  });

  it('does not alert when retry is not configured', () => {
    expect(shouldAlert({})).toBe(false);
  });
});

describe('payloadSize', () => {
  it('measures text payloads', () => {
    expect(payloadSize({ text: 'hello' })).toBe(5);
    expect(payloadSize({ text: '' })).toBe(0);
  });

  it('measures binary payloads', () => {
    expect(payloadSize({ blob: new Uint8Array(16) })).toBe(16);
  });
});

describe('sumDefined', () => {
  it('sums defined entries only', () => {
    expect(sumDefined([1, undefined, 2, undefined, 3])).toBe(6);
  });

  it('handles all-undefined and empty inputs', () => {
    expect(sumDefined([undefined, undefined])).toBe(0);
    expect(sumDefined([])).toBe(0);
  });

  it('keeps zeros', () => {
    expect(sumDefined([0, undefined, 0])).toBe(0);
  });
});

describe('unwrap', () => {
  it('returns the value on success', () => {
    expect(unwrap({ ok: true, value: 7 })).toBe(7);
  });

  it('throws the error message on failure', () => {
    expect(() => unwrap({ ok: false, error: 'delivery rejected' })).toThrow(
      'delivery rejected',
    );
  });
});

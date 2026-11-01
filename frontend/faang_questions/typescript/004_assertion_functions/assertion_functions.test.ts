// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import {
  Delivered,
  DeliveryStatus,
  assertDelivered,
  assertPresent,
  getReceipt,
} from './assertion_functions';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// --- Compile-time: Delivered is derived from the union --------------------

type _delivered = Expect<
  Equal<Delivered, { state: 'delivered'; deliveredAt: string; receipt: string }>
>;

// --- Compile-time: the call narrows everything after it -------------------

function deliveredProbe(status: DeliveryStatus) {
  // @ts-expect-error — receipt is not accessible before the assertion
  const early = status.receipt;
  void early;
  assertDelivered(status);
  type _narrowed = Expect<Equal<typeof status, Delivered>>;
  return status.receipt;
}
void deliveredProbe;

function presentProbe(webhookUrl: string | undefined) {
  assertPresent(webhookUrl, 'webhookUrl');
  type _narrowed = Expect<Equal<typeof webhookUrl, string>>;
  return webhookUrl.startsWith('https://');
}
void presentProbe;

// --- Runtime behavior ------------------------------------------------------

const delivered: DeliveryStatus = {
  state: 'delivered',
  deliveredAt: '2026-08-18T10:00:00Z',
  receipt: 'rcpt-991',
};

describe('assertDelivered', () => {
  it('returns silently for a delivered status', () => {
    expect(() => assertDelivered(delivered)).not.toThrow();
  });

  it('throws with the actual state for other variants', () => {
    expect(() => assertDelivered({ state: 'queued', position: 3 })).toThrow(
      'Expected delivered, got queued',
    );
    expect(() =>
      assertDelivered({ state: 'in_transit', carrier: 'DHL' }),
    ).toThrow('Expected delivered, got in_transit');
    expect(() =>
      assertDelivered({ state: 'failed', reason: 'checksum' }),
    ).toThrow('Expected delivered, got failed');
  });
});

describe('assertPresent', () => {
  it('throws a labeled error on null and undefined', () => {
    expect(() => assertPresent(null, 'webhookUrl')).toThrow(
      'webhookUrl is missing',
    );
    expect(() => assertPresent(undefined, 'apiKey')).toThrow(
      'apiKey is missing',
    );
  });

  it('keeps falsy-but-present values', () => {
    expect(() => assertPresent('', 'note')).not.toThrow();
    expect(() => assertPresent(0, 'count')).not.toThrow();
    expect(() => assertPresent(false, 'flag')).not.toThrow();
  });
});

describe('getReceipt', () => {
  it('returns the receipt for a delivered status', () => {
    expect(getReceipt(delivered)).toBe('rcpt-991');
  });

  it('throws for a non-delivered status', () => {
    expect(() => getReceipt({ state: 'queued', position: 1 })).toThrow(
      'Expected delivered, got queued',
    );
  });
});

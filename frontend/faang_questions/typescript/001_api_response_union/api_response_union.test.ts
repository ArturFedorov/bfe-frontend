// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import {
  Integration,
  IntegrationStatusResponse,
  assertNever,
  describeResponse,
} from './api_response_union';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// --- Compile-time: the union has the right shape --------------------------

type Success = Extract<IntegrationStatusResponse, { status: 'success' }>;
type Err = Extract<IntegrationStatusResponse, { status: 'error' }>;

type _cases = [
  Expect<
    Equal<IntegrationStatusResponse['status'], 'loading' | 'success' | 'error'>
  >,
  Expect<Equal<Success['integrations'], Integration[]>>,
  Expect<Equal<Success['fetchedAt'], string>>,
  Expect<Equal<Err['code'], number>>,
  Expect<Equal<Err['message'], string>>,
];

// --- Compile-time: fields are only readable after narrowing ---------------

function narrowingProbe(res: IntegrationStatusResponse): number {
  // @ts-expect-error — integrations is not accessible before narrowing on status
  const early = res.integrations;
  void early;
  if (res.status === 'success') {
    type _narrowed = Expect<Equal<typeof res, Success>>;
    return res.integrations.length;
  }
  return 0;
}
void narrowingProbe;

// --- Compile-time: the documented extra variant breaks the switch ---------

type TimeoutResponse = { status: 'timeout'; retryAfterMs: number };

function handleWithTimeout(
  res: IntegrationStatusResponse | TimeoutResponse,
): string {
  switch (res.status) {
    case 'loading':
      return 'loading';
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    default:
      // @ts-expect-error — 'timeout' is unhandled, so res is not never here
      return assertNever(res);
  }
}
void handleWithTimeout;

// --- Runtime behavior ------------------------------------------------------

describe('describeResponse', () => {
  it('describes the loading state', () => {
    expect(describeResponse({ status: 'loading' })).toBe(
      'Loading integration status…',
    );
  });

  it('summarizes integrations on success', () => {
    const integrations: Integration[] = [
      { id: 'i-1', partner: 'Dolby', healthy: true },
      { id: 'i-2', partner: 'Roku', healthy: false },
      { id: 'i-3', partner: 'LG', healthy: true },
    ];
    expect(
      describeResponse({
        status: 'success',
        integrations,
        fetchedAt: '2026-08-18T10:00:00Z',
      }),
    ).toBe('3 integrations (2 healthy)');
  });

  it('handles an empty success payload', () => {
    expect(
      describeResponse({
        status: 'success',
        integrations: [],
        fetchedAt: '2026-08-18T10:00:00Z',
      }),
    ).toBe('0 integrations (0 healthy)');
  });

  it('describes the error state', () => {
    expect(
      describeResponse({
        status: 'error',
        code: 503,
        message: 'upstream unavailable',
      }),
    ).toBe('Failed (503): upstream unavailable');
  });
});

describe('assertNever', () => {
  it('throws when reached at runtime', () => {
    expect(() => assertNever({ status: 'timeout' } as never)).toThrow(
      /Unexpected variant/,
    );
  });
});

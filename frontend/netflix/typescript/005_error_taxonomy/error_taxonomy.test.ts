// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import {
  AppError,
  ErrorByKind,
  ErrorHandlerMap,
  ErrorKind,
  describeError,
  errorHandlers,
} from './error_taxonomy';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// --- Compile-time: the taxonomy types are precise --------------------------

type _cases = [
  Expect<Equal<ErrorKind, 'network' | 'validation' | 'auth' | 'unknown'>>,
  Expect<Equal<ErrorByKind<'auth'>, { kind: 'auth'; reason: 'expired' | 'missing' }>>,
  Expect<Equal<ErrorHandlerMap['network'], (error: ErrorByKind<'network'>) => string>>,
];

// satisfies (not an annotation) keeps each handler's parameter narrowed:
type _networkParam = Expect<
  Equal<Parameters<typeof errorHandlers.network>[0], ErrorByKind<'network'>>
>;
type _unknownParam = Expect<
  Equal<Parameters<typeof errorHandlers.unknown>[0], ErrorByKind<'unknown'>>
>;

// --- Compile-time: wrong maps are rejected ---------------------------------

const missingKind = {
  network: (error: ErrorByKind<'network'>) => error.url,
  validation: (error: ErrorByKind<'validation'>) => error.field,
  auth: (error: ErrorByKind<'auth'>) => error.reason,
  // @ts-expect-error — a map missing the 'unknown' kind must not satisfy ErrorHandlerMap
} satisfies ErrorHandlerMap;
void missingKind;

const wrongVariant = {
  network: (error: ErrorByKind<'network'>) => error.url,
  // @ts-expect-error — the validation handler must accept the validation variant
  validation: (error: ErrorByKind<'network'>) => error.url,
  auth: (error: ErrorByKind<'auth'>) => error.reason,
  unknown: () => 'unknown',
} satisfies ErrorHandlerMap;
void wrongVariant;

// Adding a variant to the union breaks the existing map where it should:
type ExtendedError = AppError | { kind: 'rate_limit'; retryAfterMs: number };
type ExtendedHandlerMap = {
  [K in ExtendedError['kind']]: (error: Extract<ExtendedError, { kind: K }>) => string;
};
// @ts-expect-error — errorHandlers has no rate_limit handler yet
const incomplete: ExtendedHandlerMap = errorHandlers;
void incomplete;

// --- Runtime behavior ------------------------------------------------------

describe('describeError', () => {
  it('describes network errors', () => {
    expect(describeError({ kind: 'network', status: 503, url: '/v1/partners' })).toBe(
      'Network 503 on /v1/partners',
    );
  });

  it('describes validation errors', () => {
    expect(
      describeError({ kind: 'validation', field: 'webhookUrl', message: 'must be https' }),
    ).toBe('Validation failed on webhookUrl: must be https');
  });

  it('describes auth errors for both reasons', () => {
    expect(describeError({ kind: 'auth', reason: 'expired' })).toBe('Auth error: token expired');
    expect(describeError({ kind: 'auth', reason: 'missing' })).toBe('Auth error: token missing');
  });

  it('stringifies unknown causes', () => {
    expect(describeError({ kind: 'unknown', cause: new Error('boom') })).toBe(
      'Unknown error: Error: boom',
    );
    expect(describeError({ kind: 'unknown', cause: 42 })).toBe('Unknown error: 42');
  });
});

describe('errorHandlers', () => {
  it('has a handler per kind', () => {
    expect(Object.keys(errorHandlers).sort()).toEqual([
      'auth',
      'network',
      'unknown',
      'validation',
    ]);
  });
});

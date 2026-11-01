// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import * as fs from 'fs';
import * as path from 'path';
import {
  DeliveryWebhook,
  isRecord,
  parseDeliveryWebhook,
} from './unknown_boundary';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// --- Compile-time: isRecord narrows unknown -------------------------------

function recordProbe(mystery: unknown) {
  if (isRecord(mystery)) {
    type _narrowed = Expect<Equal<typeof mystery, Record<string, unknown>>>;
  }
}
void recordProbe;

// --- Compile-time: the parsed result is fully typed -----------------------

function typeProbe(payload: unknown) {
  const parsed = parseDeliveryWebhook(payload);
  type _event = Expect<Equal<typeof parsed.event, 'delivery.completed'>>;
  type _assets = Expect<
    Equal<(typeof parsed.assets)[number]['sizeBytes'], number>
  >;
  // @ts-expect-error — undeclared fields do not survive the boundary
  return parsed.rawBody;
}
void typeProbe;

// --- Runtime behavior ------------------------------------------------------

const valid = {
  event: 'delivery.completed',
  deliveryId: 'd-42',
  partnerId: 'p-7',
  assets: [
    { id: 'a-1', sizeBytes: 1024 },
    { id: 'a-2', sizeBytes: 2048 },
  ],
};

describe('parseDeliveryWebhook', () => {
  it('parses a valid payload', () => {
    const parsed: DeliveryWebhook = parseDeliveryWebhook(
      JSON.parse(JSON.stringify(valid)),
    );
    expect(parsed).toEqual(valid);
  });

  it('rejects a non-object payload with the root path', () => {
    expect(() => parseDeliveryWebhook(null)).toThrow(
      'Invalid webhook at $: expected object',
    );
    expect(() => parseDeliveryWebhook('body')).toThrow(
      'Invalid webhook at $: expected object',
    );
    expect(() => parseDeliveryWebhook([valid])).toThrow(
      'Invalid webhook at $: expected object',
    );
  });

  it('rejects a wrong event name', () => {
    expect(() =>
      parseDeliveryWebhook({ ...valid, event: 'delivery.started' }),
    ).toThrow('Invalid webhook at $.event: expected "delivery.completed"');
  });

  it('rejects non-string ids with their field path', () => {
    expect(() => parseDeliveryWebhook({ ...valid, deliveryId: 7 })).toThrow(
      'Invalid webhook at $.deliveryId: expected string',
    );
    expect(() =>
      parseDeliveryWebhook({ ...valid, partnerId: undefined }),
    ).toThrow('Invalid webhook at $.partnerId: expected string');
  });

  it('rejects a non-array assets field', () => {
    expect(() => parseDeliveryWebhook({ ...valid, assets: {} })).toThrow(
      'Invalid webhook at $.assets: expected array',
    );
  });

  it('points at the exact broken asset element', () => {
    const payload = {
      ...valid,
      assets: [{ id: 'a-1', sizeBytes: 1 }, { id: 'a-2' }],
    };
    expect(() => parseDeliveryWebhook(payload)).toThrow(
      'Invalid webhook at $.assets[1].sizeBytes: expected number',
    );
  });

  it('rejects non-finite sizes', () => {
    const payload = { ...valid, assets: [{ id: 'a-1', sizeBytes: NaN }] };
    expect(() => parseDeliveryWebhook(payload)).toThrow(
      'Invalid webhook at $.assets[0].sizeBytes: expected number',
    );
  });
});

describe('isRecord', () => {
  it('accepts plain objects only', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord('x')).toBe(false);
  });
});

describe('zero-cast rule', () => {
  it('the source contains no cast or non-null-assertion syntax', () => {
    const source = fs.readFileSync(
      path.join(__dirname, 'unknown_boundary.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/\bas\s+(const|any|unknown|never|[A-Z])/);
    expect(source).not.toMatch(/!\./);
  });
});

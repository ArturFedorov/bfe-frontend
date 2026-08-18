// Type assertions in this file fail to compile until the types are implemented —
// a compile error here IS a failing test.

import {
  EventOfType,
  HandlerRegistry,
  WebhookEvent,
  WebhookEventType,
  dispatchEvent,
} from './webhook_event_map';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// --- Compile-time: per-key handler parameters are exact ---------------------

type _cases = [
  Expect<Equal<WebhookEventType, 'delivery.created' | 'delivery.failed' | 'partner.linked'>>,
  Expect<
    Equal<
      Parameters<HandlerRegistry['delivery.created']>[0],
      { type: 'delivery.created'; deliveryId: string; partnerId: string }
    >
  >,
  Expect<
    Equal<
      Parameters<HandlerRegistry['delivery.failed']>[0],
      { type: 'delivery.failed'; deliveryId: string; errorCode: number }
    >
  >,
  Expect<
    Equal<
      Parameters<HandlerRegistry['partner.linked']>[0],
      { type: 'partner.linked'; partnerId: string; linkedBy: string }
    >
  >,
];

// --- Compile-time: registry literals infer handler params from the key ------

const inferenceProbe: HandlerRegistry = {
  'delivery.created': (event) => {
    type _e = Expect<Equal<typeof event, EventOfType<'delivery.created'>>>;
    void event.deliveryId;
  },
  'delivery.failed': (event) => {
    type _e = Expect<Equal<typeof event, EventOfType<'delivery.failed'>>>;
    void event.errorCode;
  },
  'partner.linked': (event) => {
    type _e = Expect<Equal<typeof event, EventOfType<'partner.linked'>>>;
    // @ts-expect-error — errorCode belongs to delivery.failed, not partner.linked
    void event.errorCode;
  },
};
void inferenceProbe;

// @ts-expect-error — a registry missing an event type must not compile
const incomplete: HandlerRegistry = {
  'delivery.created': () => undefined,
  'delivery.failed': () => undefined,
};
void incomplete;

// --- Runtime behavior --------------------------------------------------------

function makeRegistry() {
  const created = jest.fn();
  const failed = jest.fn();
  const linked = jest.fn();
  const registry: HandlerRegistry = {
    'delivery.created': created,
    'delivery.failed': failed,
    'partner.linked': linked,
  };
  return { registry, created, failed, linked };
}

describe('dispatchEvent', () => {
  it('routes delivery.created to its handler with the full event', () => {
    const { registry, created, failed, linked } = makeRegistry();
    const event: WebhookEvent = { type: 'delivery.created', deliveryId: 'd-1', partnerId: 'p-1' };
    dispatchEvent(registry, event);
    expect(created).toHaveBeenCalledTimes(1);
    expect(created).toHaveBeenCalledWith(event);
    expect(failed).not.toHaveBeenCalled();
    expect(linked).not.toHaveBeenCalled();
  });

  it('routes delivery.failed to its handler', () => {
    const { registry, created, failed } = makeRegistry();
    const event: WebhookEvent = { type: 'delivery.failed', deliveryId: 'd-2', errorCode: 429 };
    dispatchEvent(registry, event);
    expect(failed).toHaveBeenCalledWith(event);
    expect(created).not.toHaveBeenCalled();
  });

  it('routes partner.linked to its handler', () => {
    const { registry, linked } = makeRegistry();
    const event: WebhookEvent = { type: 'partner.linked', partnerId: 'p-9', linkedBy: 'ops' };
    dispatchEvent(registry, event);
    expect(linked).toHaveBeenCalledWith(event);
  });
});

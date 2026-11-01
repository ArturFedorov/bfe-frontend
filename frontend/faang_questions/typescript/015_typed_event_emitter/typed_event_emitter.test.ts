// Hybrid suite: runtime jest tests + inline type assertions.
// Compile errors here ARE failing tests — ts-jest type-checks this file.
import { IntegrationEvents, TypedEmitter } from './typed_event_emitter';

type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

describe('015 typed_event_emitter — runtime', () => {
  let emitter: TypedEmitter<IntegrationEvents>;

  beforeEach(() => {
    emitter = new TypedEmitter<IntegrationEvents>();
  });

  it('delivers the payload to a subscribed handler', () => {
    const seen: string[] = [];
    emitter.on(
      'partner:connected',
      (payload: IntegrationEvents['partner:connected']) =>
        seen.push(payload.partnerId),
    );

    emitter.emit('partner:connected', { partnerId: 'p-1', at: 1700000000 });
    expect(seen).toEqual(['p-1']);
  });

  it('supports multiple handlers per event, called in order', () => {
    const order: string[] = [];
    emitter.on('report:ready', () => order.push('first'));
    emitter.on('report:ready', () => order.push('second'));

    emitter.emit('report:ready', { reportId: 'r-1', rows: 10 });
    expect(order).toEqual(['first', 'second']);
  });

  it('keeps handler lists isolated per event', () => {
    const seen: string[] = [];
    emitter.on('partner:connected', () => seen.push('connected'));
    emitter.on('partner:disconnected', () => seen.push('disconnected'));

    emitter.emit('partner:disconnected', {
      partnerId: 'p-1',
      reason: 'credentials expired',
    });
    expect(seen).toEqual(['disconnected']);
  });

  it('emit with no handlers is a no-op', () => {
    expect(() =>
      emitter.emit('report:ready', { reportId: 'r-9', rows: 0 }),
    ).not.toThrow();
  });

  it('off removes a handler', () => {
    let calls = 0;
    const handler = () => {
      calls += 1;
    };
    emitter.on('report:ready', handler);
    emitter.emit('report:ready', { reportId: 'r-1', rows: 1 });
    emitter.off('report:ready', handler);
    emitter.emit('report:ready', { reportId: 'r-2', rows: 2 });

    expect(calls).toBe(1);
  });

  it('off leaves other handlers for the same event intact', () => {
    const seen: string[] = [];
    const removed = () => seen.push('removed');
    emitter.on('report:ready', removed);
    emitter.on('report:ready', () => seen.push('kept'));
    emitter.off('report:ready', removed);

    emitter.emit('report:ready', { reportId: 'r-1', rows: 1 });
    expect(seen).toEqual(['kept']);
  });

  it('once fires exactly once', () => {
    let calls = 0;
    emitter.once('partner:connected', () => {
      calls += 1;
    });

    emitter.emit('partner:connected', { partnerId: 'p-1', at: 1 });
    emitter.emit('partner:connected', { partnerId: 'p-2', at: 2 });
    expect(calls).toBe(1);
  });

  it('once receives the payload of the first emit', () => {
    const seen: number[] = [];
    emitter.once('report:ready', (payload: IntegrationEvents['report:ready']) =>
      seen.push(payload.rows),
    );

    emitter.emit('report:ready', { reportId: 'r-1', rows: 42 });
    emitter.emit('report:ready', { reportId: 'r-2', rows: 99 });
    expect(seen).toEqual([42]);
  });
});

// --- inference contracts (compile-time only; never executed) ---
const _contracts = () => {
  const emitter = new TypedEmitter<IntegrationEvents>();

  emitter.on('report:ready', (payload) => {
    type _ReportPayload = Expect<
      Equal<typeof payload, { reportId: string; rows: number }>
    >;
  });

  emitter.on('partner:disconnected', (payload) => {
    type _DisconnectPayload = Expect<
      Equal<typeof payload, { partnerId: string; reason: string }>
    >;
  });

  // @ts-expect-error — unknown event names are rejected
  emitter.on('nope', () => {});

  // @ts-expect-error — payload missing a required field
  emitter.emit('report:ready', { reportId: 'r-1' });

  // @ts-expect-error — payload from a different event does not fit
  emitter.emit('partner:connected', {
    partnerId: 'p-1',
    reason: 'wrong shape',
  });

  // @ts-expect-error — unknown event cannot be emitted
  emitter.emit('nope', {});

  // @ts-expect-error — handler payload type is enforced, not just inferred
  emitter.on('report:ready', (payload: { totallyWrong: boolean }) => payload);
};
void _contracts;

import { TypedEmitter } from './type_safe_event_emitter';

type Events = {
  click: { x: number; y: number };
  message: string;
  reset: void;
};

describe('TypedEmitter — dispatch', () => {
  it('delivers typed payloads to listeners', () => {
    const ee = new TypedEmitter<Events>();
    const seen: number[] = [];
    ee.on('click', (p) => seen.push(p.x));
    const fired = ee.emit('click', { x: 1, y: 2 });
    expect(fired).toBe(true);
    expect(seen).toEqual([1]);
  });

  it('returns false when there are no listeners', () => {
    const ee = new TypedEmitter<Events>();
    expect(ee.emit('click', { x: 0, y: 0 })).toBe(false);
  });

  it('invokes every listener in registration order', () => {
    const ee = new TypedEmitter<Events>();
    const order: string[] = [];
    ee.on('message', (m) => order.push(`a:${m}`));
    ee.on('message', (m) => order.push(`b:${m}`));
    ee.emit('message', 'hi');
    expect(order).toEqual(['a:hi', 'b:hi']);
  });

  it('fires the same payload to all listeners', () => {
    const ee = new TypedEmitter<Events>();
    const received: Array<{ x: number; y: number }> = [];
    ee.on('click', (p) => received.push(p));
    ee.on('click', (p) => received.push(p));
    const payload = { x: 3, y: 4 };
    ee.emit('click', payload);
    expect(received).toEqual([payload, payload]);
  });

  it('isolates events from one another', () => {
    const ee = new TypedEmitter<Events>();
    const clicks: number[] = [];
    const messages: string[] = [];
    ee.on('click', (p) => clicks.push(p.x));
    ee.on('message', (m) => messages.push(m));

    ee.emit('message', 'only-message');
    expect(clicks).toEqual([]);
    expect(messages).toEqual(['only-message']);
  });

  it('supports void payloads', () => {
    const ee = new TypedEmitter<Events>();
    let count = 0;
    ee.on('reset', () => {
      count += 1;
    });
    expect(ee.emit('reset', undefined)).toBe(true);
    expect(count).toBe(1);
  });
});

describe('TypedEmitter — off', () => {
  it('removes a specific listener only', () => {
    const ee = new TypedEmitter<Events>();
    const kept: string[] = [];
    const removed: string[] = [];
    const keptListener = (m: string) => kept.push(m);
    const removedListener = (m: string) => removed.push(m);

    ee.on('message', keptListener);
    ee.on('message', removedListener);
    ee.off('message', removedListener);
    ee.emit('message', 'x');

    expect(kept).toEqual(['x']);
    expect(removed).toEqual([]);
  });

  it('reports no listeners after the last is removed', () => {
    const ee = new TypedEmitter<Events>();
    const listener = () => {};
    ee.on('reset', listener);
    ee.off('reset', listener);
    expect(ee.emit('reset', undefined)).toBe(false);
  });

  it('is a no-op for a listener that was never registered', () => {
    const ee = new TypedEmitter<Events>();
    const seen: string[] = [];
    ee.on('message', (m) => seen.push(m));
    ee.off('message', () => {}); // different reference
    ee.emit('message', 'still-here');
    expect(seen).toEqual(['still-here']);
  });

  it('does not disturb the current dispatch when a listener removes another', () => {
    const ee = new TypedEmitter<Events>();
    const calls: string[] = [];
    const second = () => calls.push('second');
    ee.on('reset', () => {
      calls.push('first');
      ee.off('reset', second); // remove a not-yet-called listener mid-emit
    });
    ee.on('reset', second);

    ee.emit('reset', undefined);
    // The snapshot taken at emit time means `second` still runs this round.
    expect(calls).toEqual(['first', 'second']);
  });
});

describe('TypedEmitter — chaining & types', () => {
  it('returns the instance from on/off for chaining', () => {
    const ee = new TypedEmitter<Events>();
    const listener = (m: string) => m;
    expect(ee.on('message', listener)).toBe(ee);
    expect(ee.off('message', listener)).toBe(ee);
  });

  it('enforces payload and listener types at compile time', () => {
    const ee = new TypedEmitter<Events>();

    // @ts-expect-error click requires { x: number; y: number }
    ee.emit('click', { x: 1 });

    // @ts-expect-error message expects a string payload
    ee.emit('message', 123);

    // @ts-expect-error listener payload must match the event's type
    ee.on('click', (p: string) => p);

    // @ts-expect-error unknown event names are rejected
    ee.on('nope', () => {});

    expect(true).toBe(true);
  });
});

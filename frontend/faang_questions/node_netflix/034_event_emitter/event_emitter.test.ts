import { EventEmitter } from './event_emitter';

describe('EventEmitter — basics', () => {
  it('calls registered listeners with args', () => {
    const ee = new EventEmitter();
    const fn = jest.fn();
    ee.on('data', fn);
    ee.emit('data', 1, 2);
    expect(fn).toHaveBeenCalledWith(1, 2);
  });

  it('removes listeners with off', () => {
    const ee = new EventEmitter();
    const fn = jest.fn();
    ee.on('x', fn);
    ee.off('x', fn);
    ee.emit('x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('returns true only when a listener fired', () => {
    const ee = new EventEmitter();
    expect(ee.emit('x')).toBe(false);
    ee.on('x', () => {});
    expect(ee.emit('x')).toBe(true);
  });
});

describe('EventEmitter — once', () => {
  it('fires exactly once then auto-removes', () => {
    const ee = new EventEmitter();
    const fn = jest.fn();
    ee.once('x', fn);

    expect(ee.emit('x')).toBe(true);
    // After firing, the listener is gone: nothing left to fire.
    expect(ee.emit('x')).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('forwards args to a once listener', () => {
    const ee = new EventEmitter();
    const fn = jest.fn();
    ee.once('x', fn);
    ee.emit('x', 'a', 42);
    expect(fn).toHaveBeenCalledWith('a', 42);
  });

  it('supports multiple independent once listeners', () => {
    const ee = new EventEmitter();
    const a = jest.fn();
    const b = jest.fn();
    ee.once('x', a);
    ee.once('x', b);

    ee.emit('x');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    ee.emit('x');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('mixes once and on listeners, keeping the on listener', () => {
    const ee = new EventEmitter();
    const persistent = jest.fn();
    const single = jest.fn();
    ee.on('x', persistent);
    ee.once('x', single);

    ee.emit('x');
    ee.emit('x');

    expect(persistent).toHaveBeenCalledTimes(2);
    expect(single).toHaveBeenCalledTimes(1);
  });
});

describe('EventEmitter — off during emit (snapshot)', () => {
  it('runs the whole current dispatch even if a listener removes another', () => {
    const ee = new EventEmitter();
    const calls: string[] = [];
    const a = () => {
      calls.push('a');
      ee.off('x', b);
    };
    const b = () => calls.push('b');
    ee.on('x', a);
    ee.on('x', b);

    ee.emit('x');
    // both run this round (snapshot); b is gone next time
    expect(calls).toEqual(['a', 'b']);

    ee.emit('x');
    expect(calls).toEqual(['a', 'b', 'a']);
  });

  it('does not invoke a listener added during the current emit', () => {
    const ee = new EventEmitter();
    const calls: string[] = [];
    const late = () => calls.push('late');
    ee.on('x', () => {
      calls.push('first');
      ee.on('x', late); // added mid-dispatch
    });

    ee.emit('x');
    expect(calls).toEqual(['first']); // `late` not called this round

    ee.emit('x');
    expect(calls).toEqual(['first', 'first', 'late']);
  });

  it('auto-removes a once listener mid-dispatch without skipping siblings', () => {
    const ee = new EventEmitter();
    const calls: string[] = [];
    ee.once('x', () => calls.push('once'));
    ee.on('x', () => calls.push('always'));

    ee.emit('x');
    expect(calls).toEqual(['once', 'always']);

    ee.emit('x');
    expect(calls).toEqual(['once', 'always', 'always']);
  });
});

describe('EventEmitter — once + off edge case', () => {
  it('removes a pending once listener by its original reference', () => {
    const ee = new EventEmitter();
    const fn = jest.fn();
    ee.once('x', fn);
    // off is called with the ORIGINAL listener, not the internal once-wrapper.
    ee.off('x', fn);

    expect(ee.emit('x')).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it('removes only the targeted once listener, leaving others intact', () => {
    const ee = new EventEmitter();
    const a = jest.fn();
    const b = jest.fn();
    ee.once('x', a);
    ee.once('x', b);

    ee.off('x', a); // cancel only `a` before it ever fires
    ee.emit('x');

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});

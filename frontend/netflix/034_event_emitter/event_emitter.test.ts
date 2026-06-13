import { EventEmitter } from './event_emitter';

describe('EventEmitter', () => {
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

  it('once fires exactly once', () => {
    const ee = new EventEmitter();
    const fn = jest.fn();
    ee.once('x', fn);
    ee.emit('x');
    ee.emit('x');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('handles off() during emit safely', () => {
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
    // both run on this dispatch (snapshot); b is gone next time
    expect(calls).toEqual(['a', 'b']);
    ee.emit('x');
    expect(calls).toEqual(['a', 'b', 'a']);
  });
});

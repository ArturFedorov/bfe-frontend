import { EventEmitter } from './eventEmitter';

describe('EventEmitter', () => {
  test('on + emit should call the listener', () => {
    const emitter = new EventEmitter();
    const fn = jest.fn();
    emitter.on('test', fn);
    emitter.emit('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should support multiple listeners for the same event', () => {
    const emitter = new EventEmitter();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    emitter.on('test', fn1);
    emitter.on('test', fn2);
    emitter.emit('test');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  test('off should remove a specific listener', () => {
    const emitter = new EventEmitter();
    const fn = jest.fn();
    emitter.on('test', fn);
    emitter.off('test', fn);
    emitter.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });

  test('once should fire listener only once', () => {
    const emitter = new EventEmitter();
    const fn = jest.fn();
    emitter.once('test', fn);
    emitter.emit('test');
    emitter.emit('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('emit should return true if listeners exist', () => {
    const emitter = new EventEmitter();
    emitter.on('test', () => {});
    expect(emitter.emit('test')).toBe(true);
  });

  test('emit should return false if no listeners exist', () => {
    const emitter = new EventEmitter();
    expect(emitter.emit('test')).toBe(false);
  });

  test('emit should pass arguments to listeners', () => {
    const emitter = new EventEmitter();
    const fn = jest.fn();
    emitter.on('data', fn);
    emitter.emit('data', 1, 'two', { three: 3 });
    expect(fn).toHaveBeenCalledWith(1, 'two', { three: 3 });
  });

  test('off on non-existent listener should not throw', () => {
    const emitter = new EventEmitter();
    const fn = jest.fn();
    expect(() => emitter.off('test', fn)).not.toThrow();
  });

  test('should support method chaining', () => {
    const emitter = new EventEmitter();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const result = emitter.on('a', fn1).on('b', fn2).once('c', fn1);
    expect(result).toBe(emitter);
    emitter.emit('a');
    emitter.emit('b');
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});

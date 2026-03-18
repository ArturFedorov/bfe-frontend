import { debounce } from './debounce';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('debounce — trailing (default)', () => {
  test('should delay invocation by delay ms', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should reset timer on subsequent calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);
    debounced();
    jest.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should pass the latest arguments', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    debounced('c');

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('c');
  });

  test('should preserve this context', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    const obj = { debounced };
    obj.debounced();

    jest.advanceTimersByTime(100);
    expect(fn.mock.instances[0]).toBe(obj);
  });

  test('should handle multiple separate invocations', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 50);

    debounced('first');
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');

    debounced('second');
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  test('should not invoke if timer has not elapsed', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    debounced();
    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should handle zero delay', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 0);

    debounced('x');
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledWith('x');
  });

  test('should pass multiple arguments', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced(1, 'two', { three: 3 });
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith(1, 'two', { three: 3 });
  });

  test('should handle rapid successive calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < 100; i++) {
      debounced(i);
    }

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(99);
  });
});

describe('debounce — leading: true, trailing: false', () => {
  test('should invoke immediately on first call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100, { leading: true, trailing: false });

    debounced('a');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  test('should not invoke again during the delay window', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100, { leading: true, trailing: false });

    debounced('a');
    debounced('b');
    debounced('c');

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  test('should invoke again after the delay window expires', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100, { leading: true, trailing: false });

    debounced('first');
    jest.advanceTimersByTime(100);

    debounced('second');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });
});

describe('debounce — leading: true, trailing: true', () => {
  test('should invoke on leading edge and again on trailing edge', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100, { leading: true, trailing: true });

    debounced('a');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');

    debounced('b');
    debounced('c');

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  test('should not invoke trailing if only one call was made', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100, { leading: true, trailing: true });

    debounced('only');
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    // only one call — leading fired, no subsequent calls so trailing should not fire
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('debounce — leading: false, trailing: false', () => {
  test('should never invoke', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100, { leading: false, trailing: false });

    debounced('a');
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

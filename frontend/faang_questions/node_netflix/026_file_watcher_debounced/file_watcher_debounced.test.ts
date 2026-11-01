import { debounce } from './file_watcher_debounced';

jest.useFakeTimers();

describe('debounce', () => {
  it('calls only once after a burst', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d('a');
    d('b');
    d('c');
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the latest arguments', () => {
    const fn = jest.fn();
    const d = debounce(fn, 50);
    d('first');
    d('last');
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith('last');
  });

  it('fires again after the quiet period', () => {
    const fn = jest.fn();
    const d = debounce(fn, 50);
    d('x');
    jest.advanceTimersByTime(50);
    d('y');
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not fire before the wait period elapses', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d('a');
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
  });

  it('resets the timer on every call within the quiet window', () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d('a');
    jest.advanceTimersByTime(60);
    d('b');
    jest.advanceTimersByTime(60);
    d('c');
    jest.advanceTimersByTime(60);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(40);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('does not fire more than once for a single burst even after extra time passes', () => {
    const fn = jest.fn();
    const d = debounce(fn, 50);
    d('a');
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes through multiple arguments', () => {
    const fn = jest.fn();
    const d = debounce(fn, 50);
    d('a', 1, { key: 'value' });
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith('a', 1, { key: 'value' });
  });

  it('keeps separate debounced instances independent', () => {
    const fnA = jest.fn();
    const fnB = jest.fn();
    const dA = debounce(fnA, 50);
    const dB = debounce(fnB, 100);
    dA('a');
    dB('b');
    jest.advanceTimersByTime(50);
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it('fires immediately on the next tick when wait is 0', () => {
    const fn = jest.fn();
    const d = debounce(fn, 0);
    d('a');
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('handles many repeated bursts, firing once per quiet period', () => {
    const fn = jest.fn();
    const d = debounce(fn, 30);
    for (let burst = 0; burst < 5; burst++) {
      d(`burst-${burst}`);
      jest.advanceTimersByTime(10);
      d(`burst-${burst}-again`);
      jest.advanceTimersByTime(30);
    }
    expect(fn).toHaveBeenCalledTimes(5);
    expect(fn).toHaveBeenNthCalledWith(1, 'burst-0-again');
    expect(fn).toHaveBeenNthCalledWith(5, 'burst-4-again');
  });
});

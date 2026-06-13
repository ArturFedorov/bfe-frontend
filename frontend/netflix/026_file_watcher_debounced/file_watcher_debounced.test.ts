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
});

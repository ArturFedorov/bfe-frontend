import { createStopwatch } from './stopwatch';

describe('createStopwatch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not be running initially', () => {
    const sw = createStopwatch();
    expect(sw.isRunning()).toBe(false);
  });

  it('should return 0 elapsed initially', () => {
    const sw = createStopwatch();
    expect(sw.getElapsed()).toBe(0);
  });

  it('should start counting on start()', () => {
    const sw = createStopwatch();

    sw.start();
    expect(sw.isRunning()).toBe(true);

    jest.advanceTimersByTime(1000);
    expect(sw.getElapsed()).toBeGreaterThanOrEqual(1000);
  });

  it('should pause on stop()', () => {
    const sw = createStopwatch();

    sw.start();
    jest.advanceTimersByTime(500);
    sw.stop();

    expect(sw.isRunning()).toBe(false);
    const elapsed = sw.getElapsed();
    expect(elapsed).toBeGreaterThanOrEqual(500);

    jest.advanceTimersByTime(1000);
    expect(sw.getElapsed()).toBe(elapsed);
  });

  it('should resume after stop', () => {
    const sw = createStopwatch();

    sw.start();
    jest.advanceTimersByTime(500);
    sw.stop();

    const elapsedAfterStop = sw.getElapsed();

    sw.start();
    jest.advanceTimersByTime(500);

    expect(sw.getElapsed()).toBeGreaterThanOrEqual(elapsedAfterStop + 500);
  });

  it('should reset elapsed time and laps', () => {
    const sw = createStopwatch();

    sw.start();
    jest.advanceTimersByTime(1000);
    sw.lap();
    sw.stop();
    sw.reset();

    expect(sw.getElapsed()).toBe(0);
    expect(sw.getLaps()).toEqual([]);
    expect(sw.isRunning()).toBe(false);
  });

  it('should record lap times', () => {
    const sw = createStopwatch();

    sw.start();
    jest.advanceTimersByTime(1000);
    sw.lap();

    jest.advanceTimersByTime(500);
    sw.lap();

    const laps = sw.getLaps();
    expect(laps.length).toBe(2);
    expect(laps[0]).toBeGreaterThanOrEqual(1000);
    expect(laps[1]).toBeGreaterThanOrEqual(1500);
  });

  it('should return all laps via getLaps()', () => {
    const sw = createStopwatch();

    sw.start();
    jest.advanceTimersByTime(100);
    sw.lap();
    jest.advanceTimersByTime(200);
    sw.lap();
    jest.advanceTimersByTime(300);
    sw.lap();

    expect(sw.getLaps().length).toBe(3);
  });

  it('should return correct running state', () => {
    const sw = createStopwatch();

    expect(sw.isRunning()).toBe(false);

    sw.start();
    expect(sw.isRunning()).toBe(true);

    sw.stop();
    expect(sw.isRunning()).toBe(false);

    sw.start();
    expect(sw.isRunning()).toBe(true);

    sw.reset();
    expect(sw.isRunning()).toBe(false);
  });
});

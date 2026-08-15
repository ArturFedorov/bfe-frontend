import { RequestRateAlarm } from './request_rate_alarm';

describe('RequestRateAlarm', () => {
  it('counts a lone request as 1', () => {
    const alarm = new RequestRateAlarm();
    expect(alarm.record(0)).toBe(1);
  });

  it('counts all requests inside the 60s window', () => {
    const alarm = new RequestRateAlarm();
    expect(alarm.record(0)).toBe(1);
    expect(alarm.record(10_000)).toBe(2);
    expect(alarm.record(30_000)).toBe(3);
    expect(alarm.record(59_000)).toBe(4);
  });

  it('drops requests that are exactly 60 seconds old', () => {
    const alarm = new RequestRateAlarm();
    alarm.record(0);
    alarm.record(1);
    expect(alarm.record(60_000)).toBe(2); // t=0 is out, t=1 and t=60_000 are in
    expect(alarm.record(60_001)).toBe(2); // t=1 is out now
  });

  it('keeps a request that is 59_999ms old', () => {
    const alarm = new RequestRateAlarm();
    alarm.record(0);
    expect(alarm.record(59_999)).toBe(2);
  });

  it('counts duplicate timestamps separately', () => {
    const alarm = new RequestRateAlarm();
    expect(alarm.record(5)).toBe(1);
    expect(alarm.record(5)).toBe(2);
    expect(alarm.record(5)).toBe(3);
  });

  it('expires a whole burst after a long quiet gap', () => {
    const alarm = new RequestRateAlarm();
    alarm.record(100);
    alarm.record(200);
    alarm.record(300);
    expect(alarm.record(500_000)).toBe(1); // only itself
  });

  it('throws when timestamps go backwards', () => {
    const alarm = new RequestRateAlarm();
    alarm.record(1000);
    expect(() => alarm.record(999)).toThrow();
  });

  it('handles 100_000 requests with a bounded window in time', () => {
    const alarm = new RequestRateAlarm();
    const n = 100_000;
    let last = 0;
    for (let i = 0; i < n; i++) {
      last = alarm.record(i * 2);
    }
    // Final window (139_998, 199_998] holds timestamps i*2 for i in [70_000, 99_999].
    expect(last).toBe(30_000);
  });
});

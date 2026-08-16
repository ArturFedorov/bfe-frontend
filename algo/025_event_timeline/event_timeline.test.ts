import { sortTimeline, TimelineEvent } from './event_timeline';

describe('sortTimeline', () => {
  it('returns an empty array for an empty feed', () => {
    expect(sortTimeline([])).toEqual([]);
  });

  it('returns a single event unchanged', () => {
    const events: TimelineEvent[] = [
      { name: 'deploy', date: 100, priority: 2 },
    ];
    expect(sortTimeline(events)).toEqual([
      { name: 'deploy', date: 100, priority: 2 },
    ]);
  });

  it('sorts by date ascending', () => {
    const events: TimelineEvent[] = [
      { name: 'c', date: 300, priority: 1 },
      { name: 'a', date: 100, priority: 1 },
      { name: 'b', date: 200, priority: 1 },
    ];
    expect(sortTimeline(events).map((e) => e.date)).toEqual([100, 200, 300]);
  });

  describe('tie-breaks', () => {
    it('breaks a date tie by priority descending', () => {
      const events: TimelineEvent[] = [
        { name: 'release', date: 100, priority: 1 },
        { name: 'outage', date: 100, priority: 9 },
        { name: 'deploy', date: 100, priority: 5 },
      ];
      expect(sortTimeline(events).map((e) => e.name)).toEqual([
        'outage',
        'deploy',
        'release',
      ]);
    });

    it('breaks a date+priority tie by name ascending', () => {
      const events: TimelineEvent[] = [
        { name: 'gamma', date: 100, priority: 3 },
        { name: 'alpha', date: 100, priority: 3 },
        { name: 'beta', date: 100, priority: 3 },
      ];
      expect(sortTimeline(events).map((e) => e.name)).toEqual([
        'alpha',
        'beta',
        'gamma',
      ]);
    });

    it('never lets a later key override an earlier one', () => {
      // 'zzz' has the earliest date and must come first despite its name and
      // low priority; 'aaa' has the highest priority but the latest date.
      const events: TimelineEvent[] = [
        { name: 'aaa', date: 300, priority: 99 },
        { name: 'zzz', date: 100, priority: 0 },
        { name: 'mmm', date: 200, priority: 50 },
      ];
      expect(sortTimeline(events).map((e) => e.name)).toEqual([
        'zzz',
        'mmm',
        'aaa',
      ]);
    });

    it('applies all three keys together in a mixed feed', () => {
      const events: TimelineEvent[] = [
        { name: 'b-alert', date: 200, priority: 5 },
        { name: 'a-alert', date: 200, priority: 5 },
        { name: 'late', date: 300, priority: 9 },
        { name: 'early-low', date: 100, priority: 1 },
        { name: 'early-high', date: 100, priority: 7 },
      ];
      expect(sortTimeline(events).map((e) => e.name)).toEqual([
        'early-high',
        'early-low',
        'a-alert',
        'b-alert',
        'late',
      ]);
    });
  });

  describe('stability and purity', () => {
    it('keeps original relative order for fully identical keys', () => {
      const first: TimelineEvent = { name: 'dup', date: 100, priority: 3 };
      const second: TimelineEvent = { name: 'dup', date: 100, priority: 3 };
      const third: TimelineEvent = { name: 'dup', date: 100, priority: 3 };
      const result = sortTimeline([first, second, third]);
      expect(result[0]).toBe(first);
      expect(result[1]).toBe(second);
      expect(result[2]).toBe(third);
    });

    it('returns a new array and does not mutate the input', () => {
      const events: TimelineEvent[] = [
        { name: 'b', date: 200, priority: 1 },
        { name: 'a', date: 100, priority: 1 },
      ];
      const snapshot = events.map((e) => ({ ...e }));
      const result = sortTimeline(events);
      expect(result).not.toBe(events);
      expect(events).toEqual(snapshot);
    });
  });

  describe('large input', () => {
    it('sorts 100k events with heavy ties correctly', () => {
      const n = 100_000;
      const events: TimelineEvent[] = [];
      for (let i = 0; i < n; i++) {
        events.push({
          name: `event-${String(i % 100).padStart(3, '0')}`,
          date: (i * 7919) % 1000, // many date collisions, deterministic
          priority: i % 10,
        });
      }
      const result = sortTimeline(events);
      expect(result).toHaveLength(n);
      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        const ordered =
          prev.date < curr.date ||
          (prev.date === curr.date && prev.priority > curr.priority) ||
          (prev.date === curr.date &&
            prev.priority === curr.priority &&
            prev.name <= curr.name);
        if (!ordered) {
          throw new Error(
            `Order violated at index ${i}: ${JSON.stringify(prev)} before ${JSON.stringify(curr)}`,
          );
        }
      }
    });
  });
});

import { downsample, Sample } from './time_series_downsample';

describe('downsample', () => {
  it('aggregates samples into equal-width buckets, omitting empty ones', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: 10 },
      { timestamp: 5, value: 30 },
      { timestamp: 10, value: 20 },
      { timestamp: 95, value: 50 },
      { timestamp: 100, value: 40 },
    ];
    expect(downsample(samples, 10)).toEqual([
      { startTime: 0, endTime: 10, min: 10, max: 30, avg: 20, count: 2 },
      { startTime: 10, endTime: 20, min: 20, max: 20, avg: 20, count: 1 },
      { startTime: 90, endTime: 100, min: 40, max: 50, avg: 45, count: 2 },
    ]);
  });

  it('puts everything in one bucket when bucketCount is 1', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: 3 },
      { timestamp: 50, value: 9 },
      { timestamp: 100, value: 6 },
    ];
    expect(downsample(samples, 1)).toEqual([
      { startTime: 0, endTime: 100, min: 3, max: 9, avg: 6, count: 3 },
    ]);
  });

  it('clamps the last timestamp into the final bucket', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: 1 },
      { timestamp: 10, value: 5 },
    ];
    expect(downsample(samples, 2)).toEqual([
      { startTime: 0, endTime: 5, min: 1, max: 1, avg: 1, count: 1 },
      { startTime: 5, endTime: 10, min: 5, max: 5, avg: 5, count: 1 },
    ]);
  });

  it('returns [] for empty input', () => {
    expect(downsample([], 4)).toEqual([]);
  });

  it('handles a single sample as a zero-width bucket', () => {
    expect(downsample([{ timestamp: 42, value: 7 }], 5)).toEqual([
      { startTime: 42, endTime: 42, min: 7, max: 7, avg: 7, count: 1 },
    ]);
  });

  it('collapses samples sharing one timestamp into a single bucket', () => {
    const samples: Sample[] = [
      { timestamp: 10, value: 1 },
      { timestamp: 10, value: 5 },
      { timestamp: 10, value: 3 },
    ];
    expect(downsample(samples, 4)).toEqual([
      { startTime: 10, endTime: 10, min: 1, max: 5, avg: 3, count: 3 },
    ]);
  });

  it('handles duplicate timestamps inside a wider range', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: 2 },
      { timestamp: 0, value: 4 },
      { timestamp: 10, value: 6 },
    ];
    expect(downsample(samples, 2)).toEqual([
      { startTime: 0, endTime: 5, min: 2, max: 4, avg: 3, count: 2 },
      { startTime: 5, endTime: 10, min: 6, max: 6, avg: 6, count: 1 },
    ]);
  });

  it('handles negative values', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: -10 },
      { timestamp: 1, value: 10 },
      { timestamp: 2, value: -4 },
    ];
    expect(downsample(samples, 1)).toEqual([
      { startTime: 0, endTime: 2, min: -10, max: 10, avg: -4 / 3, count: 3 },
    ]);
  });

  it('handles non-integer averages', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: 1 },
      { timestamp: 1, value: 2 },
    ];
    const [bucket] = downsample(samples, 1);
    expect(bucket.avg).toBeCloseTo(1.5, 10);
    expect(bucket.count).toBe(2);
  });

  it('returns at most as many buckets as samples when bucketCount is huge', () => {
    const samples: Sample[] = [
      { timestamp: 0, value: 1 },
      { timestamp: 1000, value: 2 },
    ];
    const buckets = downsample(samples, 100);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].count).toBe(1);
    expect(buckets[1].count).toBe(1);
  });

  it('keeps buckets in ascending time order', () => {
    const samples: Sample[] = [];
    for (let t = 0; t <= 90; t += 10) {
      samples.push({ timestamp: t, value: t });
    }
    const buckets = downsample(samples, 3);
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].startTime).toBeGreaterThan(buckets[i - 1].startTime);
    }
  });

  describe('invalid bucketCount', () => {
    it.each([
      ['zero', 0],
      ['negative', -2],
      ['non-integer', 2.5],
      ['NaN', NaN],
      ['Infinity', Infinity],
    ])('throws RangeError on %s', (_label, bucketCount) => {
      const samples: Sample[] = [{ timestamp: 0, value: 1 }];
      expect(() => downsample(samples, bucketCount)).toThrow(RangeError);
    });
  });

  it('downsamples 100k samples into 10k buckets in a single pass', () => {
    const n = 100_001; // timestamps 0..100000 -> width exactly 10
    const bucketCount = 10_000;
    const samples: Sample[] = [];
    for (let t = 0; t < n; t++) {
      samples.push({ timestamp: t, value: t % 7 });
    }
    const buckets = downsample(samples, bucketCount);
    expect(buckets).toHaveLength(bucketCount);

    // First bucket: timestamps 0..9, values 0,1,2,3,4,5,6,0,1,2.
    expect(buckets[0]).toEqual({
      startTime: 0,
      endTime: 10,
      min: 0,
      max: 6,
      avg: 2.4,
      count: 10,
    });

    // Last bucket also absorbs the clamped final timestamp: 99990..100000.
    expect(buckets[bucketCount - 1].count).toBe(11);
    expect(buckets[bucketCount - 1].startTime).toBe(99_990);
    expect(buckets[bucketCount - 1].endTime).toBe(100_000);

    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(n);
  });
});

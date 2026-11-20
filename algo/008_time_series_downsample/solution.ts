export interface Sample {
  timestamp: number;
  value: number;
}

export interface Bucket {
  startTime: number;
  endTime: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}

export function downsample(samples: Sample[], bucketCount: number): Bucket[] {
  if (!Number.isInteger(bucketCount) || bucketCount <= 0)
    throw new RangeError('Invalid bucket count');

  if (samples.length === 0) return [];

  const t0 = samples[0].timestamp;
  const width = (samples[samples.length - 1].timestamp - t0) / bucketCount;
  const result: Bucket[] = [];

  let current: Bucket | null = null;
  let currentIndex = -1;
  let sum = 0;

  const flush = (): void => {
    if (!current) return;
    current.avg = sum / current.count;
    result.push(current);
  };

  // Samples are sorted, so bucket indices are non-decreasing: one pass suffices.
  for (const { timestamp, value } of samples) {
    const index =
      width === 0
        ? 0
        : Math.min(Math.floor((timestamp - t0) / width), bucketCount - 1);

    if (index !== currentIndex) {
      flush();
      currentIndex = index;
      sum = 0;
      current = {
        startTime: t0 + index * width,
        endTime: t0 + (index + 1) * width,
        min: value,
        max: value,
        avg: 0,
        count: 0,
      };
    }

    const bucket = current!;
    bucket.min = Math.min(bucket.min, value);
    bucket.max = Math.max(bucket.max, value);
    bucket.count++;
    sum += value;
  }

  flush();
  return result;
}

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
  // TODO: implement
  throw new Error('Not implemented');
}

export interface SourceMap {
  version: number;
  sources: string[];
  names: string[];
  mappings: string; // Base64 VLQ-encoded
}

export interface OriginalPosition {
  source: string;
  line: number; // 1-based
  column: number; // 0-based
}

/**
 * Parse a Source Map v3 `mappings` string (Base64 VLQ) and map a generated
 * position back to the original source. Decode VLQ, accumulate the delta-encoded
 * fields, and find the segment for the requested generated position.
 */
export function originalPositionFor(
  map: SourceMap,
  generated: { line: number; column: number },
): OriginalPosition | null {
  // TODO: implement
  throw new Error('Not implemented');
}

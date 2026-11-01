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

const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeVLQ(encoded: string): number[] {
  const result: number[] = [];
  let shift = 0;
  let value = 0;

  for (const char of encoded) {
    const digit = BASE64.indexOf(char);
    if (digit === -1) throw new Error(`Invalid base64: ${char}`);

    value += (digit & 0b011111) << shift;
    shift += 5;

    if ((digit & 0b100000) === 0) {
      const isNegative = value & 1;
      value >>= 1;

      result.push(isNegative ? -value : value);
      value = 0;
      shift = 0;
    }
  }

  return result;
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
  const lines = map.mappings.split(';');

  let genColumn = 0;
  let sourceIndex = 0;
  let origLine = 0;
  let origColumn = 0;
  let bestMatch: OriginalPosition | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    genColumn = 0;

    if (line === '') continue;

    const segments = line.split(',');

    for (const segment of segments) {
      const fields = decodeVLQ(segment);
      if (fields.length < 4) continue;

      genColumn += fields[0];
      sourceIndex += fields[1];
      origLine += fields[2];
      origColumn += fields[3];

      if (lineIndex + 1 === generated.line && genColumn <= generated.column) {
        bestMatch = {
          source: map.sources[sourceIndex],
          line: origLine + 1,
          column: origColumn,
        };
      }

      if (lineIndex + 1 > generated.line) {
        return bestMatch;
      }
    }
  }

  return bestMatch;
}

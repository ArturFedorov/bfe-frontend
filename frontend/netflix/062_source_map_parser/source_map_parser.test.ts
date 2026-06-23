import { originalPositionFor, SourceMap } from './source_map_parser';

const map: SourceMap = {
  version: 3,
  sources: ['original.ts'],
  names: [],
  // Single segment "AAAA" decodes to [0, 0, 0, 0]:
  // generatedColumn 0 -> source 0, original line 0, column 0.
  mappings: 'AAAA',
};

describe('originalPositionFor', () => {
  it('maps a generated position back to the original source', () => {
    expect(originalPositionFor(map, { line: 1, column: 0 })).toEqual({
      source: 'original.ts',
      line: 1,
      column: 0,
    });
  });

  it('returns null when there is no mapping', () => {
    expect(originalPositionFor(map, { line: 99, column: 99 })).toBeNull();
  });
});

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

  it('maps a second segment on the same line via delta decoding', () => {
    // "AAAA,KAAK" -> seg1 [genCol 0 -> src0 line0 col0], seg2 [genCol 5 -> src0 line0 col5]
    const twoSegments: SourceMap = {
      version: 3,
      sources: ['original.ts'],
      names: [],
      mappings: 'AAAA,KAAK',
    };
    expect(originalPositionFor(twoSegments, { line: 1, column: 0 })).toEqual({
      source: 'original.ts',
      line: 1,
      column: 0,
    });
    expect(originalPositionFor(twoSegments, { line: 1, column: 5 })).toEqual({
      source: 'original.ts',
      line: 1,
      column: 5,
    });
  });

  it('accumulates deltas across multiple generated lines', () => {
    // "AAAA;AACA" -> line1 seg [src0 line0 col0], line2 seg [src0 line1 col0]
    const twoLines: SourceMap = {
      version: 3,
      sources: ['original.ts'],
      names: [],
      mappings: 'AAAA;AACA',
    };
    expect(originalPositionFor(twoLines, { line: 1, column: 0 })).toEqual({
      source: 'original.ts',
      line: 1,
      column: 0,
    });
    expect(originalPositionFor(twoLines, { line: 2, column: 0 })).toEqual({
      source: 'original.ts',
      line: 2,
      column: 0,
    });
  });

  it('resolves the correct source when sourceIndex changes mid-line', () => {
    // "AAAA,GCAA" -> seg1 [source0 line0 col0], seg2 [genCol3 -> source1 line0 col0]
    const twoSources: SourceMap = {
      version: 3,
      sources: ['a.ts', 'b.ts'],
      names: [],
      mappings: 'AAAA,GCAA',
    };
    expect(originalPositionFor(twoSources, { line: 1, column: 0 })).toEqual({
      source: 'a.ts',
      line: 1,
      column: 0,
    });
    expect(originalPositionFor(twoSources, { line: 1, column: 3 })).toEqual({
      source: 'b.ts',
      line: 1,
      column: 0,
    });
  });

  it('resolves a mapping with three segments on one line', () => {
    // "AAAA,IAAI,MAAM" -> segments at generated columns 0, 4, 10
    const threeSegments: SourceMap = {
      version: 3,
      sources: ['original.ts'],
      names: [],
      mappings: 'AAAA,IAAI,MAAM',
    };
    expect(originalPositionFor(threeSegments, { line: 1, column: 4 })).toEqual({
      source: 'original.ts',
      line: 1,
      column: 4,
    });
    expect(originalPositionFor(threeSegments, { line: 1, column: 10 })).toEqual(
      { source: 'original.ts', line: 1, column: 10 },
    );
  });

  it('returns null for a line with no mappings at all', () => {
    const emptyMappings: SourceMap = {
      version: 3,
      sources: ['original.ts'],
      names: [],
      mappings: '',
    };
    expect(
      originalPositionFor(emptyMappings, { line: 1, column: 0 }),
    ).toBeNull();
  });
});

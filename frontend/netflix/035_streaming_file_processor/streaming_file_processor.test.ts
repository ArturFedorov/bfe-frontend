import { processInChunks } from './streaming_file_processor';

describe('processInChunks', () => {
  it('transforms each chunk and concatenates', () => {
    expect(processInChunks('abcdef', 2, (c) => c.toUpperCase())).toBe('ABCDEF');
  });

  it('handles a final partial chunk', () => {
    const chunks: string[] = [];
    processInChunks('abcde', 2, (c) => {
      chunks.push(c);
      return c;
    });
    expect(chunks).toEqual(['ab', 'cd', 'e']);
  });

  it('handles empty input', () => {
    expect(processInChunks('', 4, (c) => c)).toBe('');
  });

  it('does not invoke transform for empty input', () => {
    const transform = jest.fn((c: string) => c);
    processInChunks('', 4, transform);
    expect(transform).not.toHaveBeenCalled();
  });

  it('treats a chunkSize larger than the input as one chunk', () => {
    const chunks: string[] = [];
    const result = processInChunks('abc', 10, (c) => {
      chunks.push(c);
      return c.toUpperCase();
    });
    expect(chunks).toEqual(['abc']);
    expect(result).toBe('ABC');
  });

  it('treats a chunkSize of 1 as character-by-character', () => {
    const chunks: string[] = [];
    processInChunks('abc', 1, (c) => {
      chunks.push(c);
      return c;
    });
    expect(chunks).toEqual(['a', 'b', 'c']);
  });

  it('splits evenly when the input is a multiple of chunkSize', () => {
    const chunks: string[] = [];
    processInChunks('abcdef', 3, (c) => {
      chunks.push(c);
      return c;
    });
    expect(chunks).toEqual(['abc', 'def']);
  });

  it('preserves chunk order in the output', () => {
    let counter = 0;
    const result = processInChunks('aabbcc', 2, () => String(counter++));
    expect(result).toBe('012');
  });

  it('supports transforms that change chunk length', () => {
    expect(processInChunks('abcd', 2, (c) => c.repeat(2))).toBe('ababcdcd');
  });

  it('supports transforms that drop content', () => {
    expect(processInChunks('a1b2c3', 2, (c) => c.replace(/\d/g, ''))).toBe(
      'abc',
    );
  });

  it('passes each chunk to transform exactly once', () => {
    const transform = jest.fn((c: string) => c);
    processInChunks('abcde', 2, transform);
    expect(transform).toHaveBeenCalledTimes(3);
    expect(transform).toHaveBeenNthCalledWith(1, 'ab');
    expect(transform).toHaveBeenNthCalledWith(2, 'cd');
    expect(transform).toHaveBeenNthCalledWith(3, 'e');
  });
});

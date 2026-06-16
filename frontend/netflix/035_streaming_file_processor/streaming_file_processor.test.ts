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
});

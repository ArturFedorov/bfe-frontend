/**
 * Process a large input in fixed-size chunks (simulating Node streams over an
 * in-memory string). Apply `transform` to each chunk and concatenate the
 * results. This models read -> transform -> write piping without real I/O.
 */
export function processInChunks(
  input: string,
  chunkSize: number,
  transform: (chunk: string) => string,
): string {
  let result = '';

  if(input.length === 0) return result;

  for(let i = 0; i < input.length; i += chunkSize) {
    const chunk = input.slice(i, i + chunkSize);
    result += transform(chunk);
  }

  return result;
}

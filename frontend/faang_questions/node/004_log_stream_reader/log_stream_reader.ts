export type ChunkSource = AsyncIterable<Buffer | string>;

/**
 * Streaming line splitter. Consumes an async iterable of chunks (a Node
 * Readable qualifies) and yields one string per line.
 *
 * - Terminators: '\n' or '\r\n' (stripped from the yielded line).
 * - Handles lines split across arbitrary chunk boundaries, including a
 *   '\r\n' pair split between two chunks.
 * - Yields the trailing unterminated line at end of stream.
 * - Memory: only the current unterminated tail may be buffered — never
 *   concatenate the whole stream.
 */
export async function* splitLines(
  source: ChunkSource,
): AsyncGenerator<string, void, undefined> {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Convenience: drain splitLines into an array (test helper surface). */
export async function collectLines(source: ChunkSource): Promise<string[]> {
  // TODO: implement
  throw new Error('Not implemented');
}

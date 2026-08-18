import { Readable } from 'stream';
import { collectLines, splitLines } from './log_stream_reader';

const from = (chunks: (string | Buffer)[]): Readable => Readable.from(chunks);

describe('splitLines', () => {
  it('splits a single chunk containing multiple lines', async () => {
    const lines = await collectLines(from(['{"id":1}\n{"id":2}\n{"id":3}\n']));
    expect(lines).toEqual(['{"id":1}', '{"id":2}', '{"id":3}']);
  });

  it('reassembles a line split mid-word across chunks', async () => {
    const lines = await collectLines(from(['{"partner":"ac', 'me","status":"deliv', 'ered"}\n']));
    expect(lines).toEqual(['{"partner":"acme","status":"delivered"}']);
  });

  it('handles chunks that end exactly on a line boundary', async () => {
    const lines = await collectLines(from(['alpha\n', 'beta\n', 'gamma\n']));
    expect(lines).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('strips CRLF terminators', async () => {
    const lines = await collectLines(from(['a\r\nb\r\nc\r\n']));
    expect(lines).toEqual(['a', 'b', 'c']);
  });

  it('reassembles a CRLF split across a chunk boundary', async () => {
    const lines = await collectLines(from(['first\r', '\nsecond\r\n']));
    expect(lines).toEqual(['first', 'second']);
  });

  it('yields the trailing partial line at end of stream', async () => {
    const lines = await collectLines(from(['done\n', 'partial tail']));
    expect(lines).toEqual(['done', 'partial tail']);
  });

  it('does not emit a phantom empty line after a final newline', async () => {
    const lines = await collectLines(from(['only\n']));
    expect(lines).toEqual(['only']);
  });

  it('preserves genuinely empty lines between terminators', async () => {
    const lines = await collectLines(from(['a\n\nb\n']));
    expect(lines).toEqual(['a', '', 'b']);
  });

  it('yields nothing for an empty stream', async () => {
    expect(await collectLines(from([]))).toEqual([]);
  });

  it('accepts Buffer chunks, including mixed with strings', async () => {
    const lines = await collectLines(
      from([Buffer.from('bin-1\nbin'), '-2\n', Buffer.from('bin-3')]),
    );
    expect(lines).toEqual(['bin-1', 'bin-2', 'bin-3']);
  });

  it('accumulates a huge single line spread over many chunks', async () => {
    const chunkCount = 500;
    const chunk = 'x'.repeat(1024);
    const chunks = Array.from({ length: chunkCount }, () => chunk);
    chunks.push('\nnext\n');
    const lines = await collectLines(from(chunks));
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(chunkCount * 1024);
    expect(lines[0]).toBe(chunk.repeat(chunkCount));
    expect(lines[1]).toBe('next');
  });

  it('emits lines incrementally — completed lines arrive before the source ends', async () => {
    let sourceFinished = false;
    async function* source() {
      yield 'early\nlate-par';
      // give the consumer a turn before finishing
      await new Promise((resolve) => setImmediate(resolve));
      yield 'tial\n';
      sourceFinished = true;
    }

    const seen: { line: string; sourceFinished: boolean }[] = [];
    for await (const line of splitLines(source())) {
      seen.push({ line, sourceFinished });
    }
    // every line was delivered while the source was still producing…
    expect(seen).toEqual([
      { line: 'early', sourceFinished: false },
      { line: 'late-partial', sourceFinished: false },
    ]);
    // …and the source only completed after the last line was consumed
    expect(sourceFinished).toBe(true);
  });
});

describe('collectLines', () => {
  it('drains the generator into an array', async () => {
    await expect(collectLines(from(['a\nb\nc']))).resolves.toEqual(['a', 'b', 'c']);
  });
});

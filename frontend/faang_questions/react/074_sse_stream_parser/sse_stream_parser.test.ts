import {
  controllableStream,
  encode,
  splitBytes,
  streamFromChunks,
} from '../_helpers/fake_readable_stream';
import { parseSSE, type SSEMessage } from './sse_stream_parser';

async function collect(
  chunks: Array<string | Uint8Array>,
  options?: { signal?: AbortSignal },
): Promise<SSEMessage[]> {
  const out: SSEMessage[] = [];
  for await (const m of parseSSE(streamFromChunks(chunks), options))
    out.push(m);
  return out;
}

const msg = (data: string, extra: Partial<SSEMessage> = {}): SSEMessage => ({
  event: 'message',
  data,
  id: null,
  retry: null,
  ...extra,
});

describe('parseSSE', () => {
  describe('line and field parsing', () => {
    it('yields one default message for a single data frame', async () => {
      expect(await collect(['data: hello\n\n'])).toEqual([msg('hello')]);
    });

    it('yields several messages in order when one chunk holds several frames', async () => {
      expect(await collect(['data: a\n\ndata: b\n\ndata: c\n\n'])).toEqual([
        msg('a'),
        msg('b'),
        msg('c'),
      ]);
    });

    it('uses the event field as the type and falls back to message for the next block', async () => {
      const out = await collect([
        'event: suggestion\ndata: {"label":"DRUG"}\n\ndata: plain\n\n',
      ]);
      expect(out).toEqual([
        msg('{"label":"DRUG"}', { event: 'suggestion' }),
        msg('plain'),
      ]);
    });

    it('strips exactly one leading space after the colon and treats a bare field name as empty', async () => {
      const out = await collect([
        'data:  two spaces\n\ndata:nospace\n\ndata\n\n',
      ]);
      expect(out.map((m) => m.data)).toEqual([' two spaces', 'nospace', '']);
    });

    it('ignores comment lines and unknown fields without dispatching', async () => {
      const out = await collect([
        ': keep-alive\n\n: another comment\nfoo: bar\ndata: real\nbogus\n\n',
      ]);
      expect(out).toEqual([msg('real')]);
    });
  });

  describe('multi-line data', () => {
    it('joins consecutive data lines with a newline', async () => {
      expect(await collect(['data: line one\ndata: line two\n\n'])).toEqual([
        msg('line one\nline two'),
      ]);
    });

    it('keeps an empty data line as an empty segment in the join', async () => {
      expect(await collect(['data: a\ndata\ndata: b\n\n'])).toEqual([
        msg('a\n\nb'),
      ]);
    });
  });

  describe('blank-line dispatch', () => {
    it('does not dispatch a block without data and does not leak its event type', async () => {
      const out = await collect(['event: ping\n\ndata: after\n\n']);
      expect(out).toEqual([msg('after')]);
    });

    it('does not dispatch a block that only carries a retry line', async () => {
      expect(await collect(['retry: 3000\n\n'])).toEqual([]);
    });

    it('discards an incomplete block at end of stream', async () => {
      expect(await collect(['data: complete\n\ndata: partial'])).toEqual([
        msg('complete'),
      ]);
    });
  });

  describe('id tracking', () => {
    it('persists the last event id across later messages until changed', async () => {
      const out = await collect([
        'id: 7\ndata: a\n\ndata: b\n\nid: 9\ndata: c\n\n',
      ]);
      expect(out.map((m) => m.id)).toEqual(['7', '7', '9']);
    });

    it('resets the id to null when an empty id line arrives', async () => {
      const out = await collect(['id: 7\ndata: a\n\nid:\ndata: b\n\n']);
      expect(out.map((m) => m.id)).toEqual(['7', null]);
    });
  });

  describe('retry parsing', () => {
    it('parses an all-digit retry value as an integer scoped to its block', async () => {
      const out = await collect(['retry: 5000\ndata: a\n\ndata: b\n\n']);
      expect(out.map((m) => m.retry)).toEqual([5000, null]);
    });

    it('ignores a non-integer retry value', async () => {
      const out = await collect([
        'retry: soon\ndata: a\n\nretry: 12x\ndata: b\n\n',
      ]);
      expect(out.map((m) => m.retry)).toEqual([null, null]);
    });
  });

  describe('chunk boundaries', () => {
    it('reassembles a frame split mid-line across three chunks', async () => {
      expect(await collect(['dat', 'a: hel', 'lo\n', '\n'])).toEqual([
        msg('hello'),
      ]);
    });

    it('decodes a multibyte character split across two chunks', async () => {
      const bytes = encode('data: héllo\n\n');
      // "data: h" is 7 bytes; "é" occupies bytes 7-8 — split inside it.
      expect(await collect(splitBytes(bytes, 8))).toEqual([msg('héllo')]);
    });

    it('decodes a 4-byte emoji split in the middle', async () => {
      const bytes = encode('data: 🎉\n\n');
      // "data: " is 6 bytes; the emoji occupies bytes 6-9.
      expect(await collect(splitBytes(bytes, 8))).toEqual([msg('🎉')]);
    });

    it('treats CR at the end of one chunk and LF at the start of the next as one terminator', async () => {
      expect(await collect(['data: a\r', '\ndata: b\r\n\r\n'])).toEqual([
        msg('a\nb'),
      ]);
    });

    it('accepts a lone CR as a line terminator', async () => {
      expect(await collect(['data: a\rdata: b\r\r'])).toEqual([msg('a\nb')]);
    });

    it('accepts CRLF terminators within a single chunk', async () => {
      expect(
        await collect(['event: x\r\ndata: a\r\n\r\ndata: b\r\n\r\n']),
      ).toEqual([msg('a', { event: 'x' }), msg('b')]);
    });
  });

  describe('streaming and cancellation', () => {
    it('yields a message as soon as its blank line arrives, before the stream ends', async () => {
      const s = controllableStream();
      const it = parseSSE(s.stream)[Symbol.asyncIterator]();

      const first = it.next();
      s.push('data: ear');
      s.push('ly\n\n');
      expect(await first).toEqual({ value: msg('early'), done: false });

      s.push('data: late\n\n');
      s.end();
      expect(await it.next()).toEqual({ value: msg('late'), done: false });
      expect(await it.next()).toEqual({ value: undefined, done: true });
      expect(s.stream.locked).toBe(false);
    });

    it('abort mid-stream ends the iteration, yields nothing more and releases the reader lock', async () => {
      const s = controllableStream();
      const ac = new AbortController();
      const it = parseSSE(s.stream, { signal: ac.signal })[
        Symbol.asyncIterator
      ]();

      const first = it.next();
      s.push('data: one\n\n');
      expect(await first).toEqual({ value: msg('one'), done: false });
      expect(s.stream.locked).toBe(true);

      const pending = it.next();
      ac.abort();
      expect(await pending).toEqual({ value: undefined, done: true });
      expect(s.stream.locked).toBe(false);
      expect(await it.next()).toEqual({ value: undefined, done: true });
    });

    it('an already-aborted signal yields nothing and never locks the stream', async () => {
      const s = controllableStream();
      const ac = new AbortController();
      ac.abort();

      const out = await (async () => {
        const acc: SSEMessage[] = [];
        for await (const m of parseSSE(s.stream, { signal: ac.signal }))
          acc.push(m);
        return acc;
      })();

      expect(out).toEqual([]);
      expect(s.stream.locked).toBe(false);
    });

    it('breaking out of the loop early releases the reader lock', async () => {
      const stream = streamFromChunks(['data: a\n\n', 'data: b\n\n']);
      const seen: string[] = [];
      for await (const m of parseSSE(stream)) {
        seen.push(m.data);
        break;
      }
      expect(seen).toEqual(['a']);
      expect(stream.locked).toBe(false);
    });

    it('propagates a stream error to the consumer and releases the lock', async () => {
      const s = controllableStream();
      const it = parseSSE(s.stream)[Symbol.asyncIterator]();

      const first = it.next();
      s.push('data: ok\n\n');
      expect(await first).toEqual({ value: msg('ok'), done: false });

      const pending = it.next();
      s.fail(new Error('upstream reset'));
      await expect(pending).rejects.toThrow('upstream reset');
      expect(s.stream.locked).toBe(false);
    });
  });
});

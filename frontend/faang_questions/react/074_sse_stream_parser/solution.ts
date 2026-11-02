/**
 * Reference solution for 074 — keep the stub in sse_stream_parser.ts blank
 * for redo practice; this file is for comparison after your own attempt.
 */
export interface SSEMessage {
  event: string;
  data: string;
  id: string | null;
  retry: number | null;
}

export interface ParseSSEOptions {
  signal?: AbortSignal;
}

export function parseSSE(
  stream: ReadableStream<Uint8Array>,
  options: ParseSSEOptions = {},
): AsyncIterable<SSEMessage> {
  const { signal } = options;

  return {
    async *[Symbol.asyncIterator]() {
      // An already-aborted signal never touches the stream (no lock taken).
      if (signal?.aborted) return;

      const reader = stream.getReader();
      // stream: true keeps partial multibyte sequences until the next chunk.
      const decoder = new TextDecoder();
      let buffer = '';

      // Per-block state (reset on every dispatch / blank line) …
      let data: string[] = [];
      let event = '';
      let retry: number | null = null;
      // … and the one field that persists across blocks.
      let lastId: string | null = null;

      // Abort → cancel the pending read; read() then resolves { done: true }.
      const onAbort = () => {
        void reader.cancel().catch(() => undefined);
      };
      signal?.addEventListener('abort', onAbort, { once: true });

      function resetBlock() {
        data = [];
        event = '';
        retry = null;
      }

      /** Apply one complete line. Returns a message when the line dispatches a block. */
      function processLine(line: string): SSEMessage | null {
        if (line === '') {
          // Blank line: dispatch only if the block carried data.
          if (data.length === 0) {
            resetBlock();
            return null;
          }
          const message: SSEMessage = {
            event: event || 'message',
            data: data.join('\n'),
            id: lastId,
            retry,
          };
          resetBlock();
          return message;
        }
        if (line.startsWith(':')) return null; // comment

        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        let value = colon === -1 ? '' : line.slice(colon + 1);
        if (value.startsWith(' ')) value = value.slice(1); // exactly one space

        switch (field) {
          case 'data':
            data.push(value);
            break;
          case 'event':
            event = value;
            break;
          case 'id':
            lastId = value === '' ? null : value;
            break;
          case 'retry':
            if (/^\d+$/.test(value)) retry = Number(value);
            break;
          default:
            break; // unknown field: ignored
        }
        return null;
      }

      /**
       * Split the buffer into complete lines. A trailing '\r' is held back
       * because the next chunk may start with '\n' (CRLF split across chunks).
       */
      function* drainLines(final: boolean): Generator<string> {
        let start = 0;
        for (let i = 0; i < buffer.length; i++) {
          const ch = buffer[i];
          if (ch === '\n') {
            yield buffer.slice(start, i);
            start = i + 1;
          } else if (ch === '\r') {
            if (i + 1 === buffer.length && !final) break; // wait for more input
            yield buffer.slice(start, i);
            if (buffer[i + 1] === '\n') i++;
            start = i + 1;
          }
        }
        buffer = buffer.slice(start);
      }

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          for (const line of drainLines(false)) {
            const message = processLine(line);
            if (message) yield message;
          }
        }
        // End of stream: flush the decoder, honour a trailing CR as a
        // terminator, and discard any unterminated (incomplete) block.
        buffer += decoder.decode();
        for (const line of drainLines(true)) {
          const message = processLine(line);
          if (message) yield message;
        }
      } finally {
        signal?.removeEventListener('abort', onAbort);
        reader.releaseLock();
      }
    },
  };
}

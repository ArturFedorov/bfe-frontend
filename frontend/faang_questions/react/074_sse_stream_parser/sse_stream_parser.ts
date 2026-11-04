export interface SSEMessage {
  /** Event type; `'message'` when the block had no `event:` line. */
  event: string;
  /** All `data:` lines of the block joined with `\n`. */
  data: string;
  /** Last-Event-ID in effect for this message; persists across blocks until changed. */
  id: string | null;
  /** Integer value of a valid `retry:` line in this block, otherwise `null`. */
  retry: number | null;
}

export interface ParseSSEOptions {
  /** Aborting cancels the reader, releases its lock and ends the iteration. */
  signal?: AbortSignal;
}

export function parseSSE(
  stream: ReadableStream<Uint8Array>,
  options?: ParseSSEOptions,
): AsyncIterable<SSEMessage> {
  const signal = options?.signal;

  return {
    async *[Symbol.asyncIterator]() {
      if (signal?.aborted) return;

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let data: string[] = [];
      let event = '';
      let retry: number | null = null;
      let lastId: string | null = null;

      const onAbort = () => {
        void reader.cancel().catch(() => undefined);
      };
      signal?.addEventListener('abort', onAbort, { once: true });

      function resetBlock() {
        data = [];
        event = '';
        retry = null;
      }

      function precessLine(line: string): SSEMessage | null {
        if (line === '') {
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

        if (line.startsWith(':')) return null;

        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        let value = colon === -1 ? '' : line.slice(colon + 1);
        if (value.startsWith(' ')) value = value.slice(1);

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
            if (/\d+$/.test(value)) retry = Number(value);
            break;
          default:
            break;
        }

        return null;
      }

      function* drainLines(final: boolean): Generator<string> {
        let start = 0;
        for (let i = 0; i < buffer.length; i++) {
          const ch = buffer[i];
          if (ch === '\n') {
            yield buffer.slice(start, i);
            start = i + 1;
          } else if (ch === '\r') {
            if (i + 1 === buffer.length && !final) break;
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
            const message = precessLine(line);
            if (message) yield message;
          }
        }

        buffer += decoder.decode();
        for (const line of drainLines(true)) {
          const message = precessLine(line);
          if (message) yield message;
        }
      } finally {
        signal?.removeEventListener('abort', onAbort);
        reader.releaseLock();
      }
    },
  };
}

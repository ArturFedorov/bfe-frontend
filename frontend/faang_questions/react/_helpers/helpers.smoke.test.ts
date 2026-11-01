/** @jest-environment jsdom */
import { streamFromChunks, controllableStream, encode, splitBytes } from './fake_readable_stream';
import { FakeEventSource, installFakeEventSource, restoreEventSource } from './fake_event_source';
import { FakeResizeObserver, installFakeObservers, restoreObservers } from './fake_observers';
import { deferred } from './deferred';

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

describe('_helpers smoke', () => {
  it('streams chunks and survives a split multibyte character', async () => {
    const bytes = encode('héllo');
    const [a, b] = splitBytes(bytes, 2); // split inside "é"
    expect(await readAll(streamFromChunks([a, b]))).toBe('héllo');
  });

  it('controllable stream is driven by the test', async () => {
    const s = controllableStream();
    const done = readAll(s.stream);
    s.push('a');
    s.push('b');
    s.end();
    expect(await done).toBe('ab');
  });

  it('fake EventSource records instances and dispatches events', () => {
    installFakeEventSource();
    const es = new EventSource('/stream') as unknown as FakeEventSource;
    const seen: string[] = [];
    es.addEventListener('message', (e) => seen.push((e as MessageEvent).data));
    es.open();
    es.emit('hello', { lastEventId: '1' });
    expect(FakeEventSource.latest).toBe(es);
    expect(seen).toEqual(['hello']);
    restoreEventSource();
  });

  it('fake ResizeObserver triggers with a size', () => {
    installFakeObservers();
    const el = document.createElement('div');
    const cb = jest.fn();
    const ro = new ResizeObserver(cb) as unknown as FakeResizeObserver;
    ro.observe(el);
    ro.trigger(el, { height: 42 });
    expect(cb).toHaveBeenCalledTimes(1);
    expect((el as HTMLElement).offsetHeight).toBe(42);
    restoreObservers();
  });

  it('deferred resolves on demand', async () => {
    const d = deferred<number>();
    d.resolve(7);
    expect(await d.promise).toBe(7);
  });
});

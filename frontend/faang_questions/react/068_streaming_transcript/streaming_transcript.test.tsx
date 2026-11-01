/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StreamingTranscript } from './streaming_transcript';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Item =
  | { kind: 'value'; value: string }
  | { kind: 'end' }
  | { kind: 'error'; error: unknown };

type Waiter = ReturnType<typeof deferred<IteratorResult<string>>>;

/**
 * Controllable async iterable. Deliberately does NOT honour the abort signal:
 * it keeps delivering pushed chunks to a waiting consumer, so the tests prove
 * the component guards itself after Stop/unmount rather than relying on a
 * well-behaved source.
 */
function createStream() {
  const queue: Item[] = [];
  let waiting: Waiter | null = null;
  let signal: AbortSignal | undefined;

  const settle = (w: Waiter, item: Item) => {
    if (item.kind === 'value') w.resolve({ value: item.value, done: false });
    else if (item.kind === 'end') w.resolve({ value: undefined, done: true });
    else w.reject(item.error);
  };

  const emit = (item: Item) => {
    if (waiting) {
      const w = waiting;
      waiting = null;
      settle(w, item);
    } else {
      queue.push(item);
    }
  };

  const iterable: AsyncIterable<string> = {
    [Symbol.asyncIterator]() {
      return {
        next: () => {
          const item = queue.shift();
          const w = deferred<IteratorResult<string>>();
          if (item) settle(w, item);
          else waiting = w;
          return w.promise;
        },
      };
    },
  };

  const source = jest.fn((s: AbortSignal) => {
    signal = s;
    return iterable;
  });

  return {
    source,
    push: (chunk: string) => emit({ kind: 'value', value: chunk }),
    end: () => emit({ kind: 'end' }),
    fail: (error: unknown) => emit({ kind: 'error', error }),
    get signal(): AbortSignal {
      if (!signal) throw new Error('source was never called');
      return signal;
    },
  };
}

function setup() {
  const stream = createStream();
  const onComplete = jest.fn();
  const utils = render(<StreamingTranscript source={stream.source} onComplete={onComplete} />);
  return { stream, onComplete, ...utils };
}

async function pushAll(stream: ReturnType<typeof createStream>, chunks: string[]) {
  await act(async () => {
    for (const c of chunks) stream.push(c);
  });
}

function expectStopUnavailable() {
  const stop = screen.queryByRole('button', { name: 'Stop' });
  if (stop) expect(stop).toBeDisabled();
}

const transcript = () => screen.getByTestId('transcript');

describe('StreamingTranscript', () => {
  it('starts the stream on mount and announces that it is generating', () => {
    const { stream } = setup();

    expect(stream.source).toHaveBeenCalledTimes(1);
    expect(stream.signal.aborted).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('Generating…');
    expect(transcript()).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  });

  it('accumulates chunks by concatenation without separators or lost characters', async () => {
    const { stream } = setup();

    await pushAll(stream, ['Lab']);
    expect(transcript().textContent).toBe('Lab');

    await pushAll(stream, ['el be', 'cause…']);
    expect(transcript().textContent).toBe('Label because…');
    expect(screen.getByRole('status')).toHaveTextContent('Generating…');
  });

  it('marks the stream done and reports the full text once on normal completion', async () => {
    const { stream, onComplete } = setup();

    await pushAll(stream, ['The span ', 'mentions a dosage.']);
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      stream.end();
    });

    expect(screen.getByRole('status')).toHaveTextContent('Done');
    expect(transcript().textContent).toBe('The span mentions a dosage.');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('The span mentions a dosage.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expectStopUnavailable();
  });

  it('stop aborts the signal, keeps partial text, skips onComplete and ignores late chunks', async () => {
    const user = userEvent.setup();
    const { stream, onComplete } = setup();

    await pushAll(stream, ['Partial ', 'rationale']);
    expect(transcript().textContent).toBe('Partial rationale');

    await user.click(screen.getByRole('button', { name: 'Stop' }));

    expect(stream.signal.aborted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Stopped');
    expect(transcript().textContent).toBe('Partial rationale');
    expect(onComplete).not.toHaveBeenCalled();
    expectStopUnavailable();

    // the source keeps yielding after abort — the component must drop it
    await pushAll(stream, [' that should not appear']);
    await act(async () => {
      stream.end();
    });

    expect(transcript().textContent).toBe('Partial rationale');
    expect(screen.getByRole('status')).toHaveTextContent('Stopped');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows the error message and retains partial text when the iterable throws', async () => {
    const { stream, onComplete } = setup();

    await pushAll(stream, ['Half an ', 'explanation']);

    await act(async () => {
      stream.fail(new Error('model backend unavailable'));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('model backend unavailable');
    expect(screen.getByRole('status')).toHaveTextContent('Failed');
    expect(transcript().textContent).toBe('Half an explanation');
    expect(onComplete).not.toHaveBeenCalled();
    expectStopUnavailable();
  });

  it('aborts on unmount and ignores chunks that arrive afterwards', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { stream, onComplete, unmount } = setup();

    await pushAll(stream, ['Before ', 'unmount']);
    expect(stream.signal.aborted).toBe(false);

    unmount();
    expect(stream.signal.aborted).toBe(true);

    await pushAll(stream, ['late chunk']);
    await act(async () => {
      stream.end();
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

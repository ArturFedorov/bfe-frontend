import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

export type TranscriptStatus = 'streaming' | 'done' | 'stopped' | 'error';

export interface StreamingTranscriptProps {
  /** Starts the stream. Must honour the signal: stop yielding once aborted. */
  source: (signal: AbortSignal) => AsyncIterable<string>;
  /** Called once with the full text when the stream completes normally. */
  onComplete?: (text: string) => void;
}

const STATUS_LABEL: Record<TranscriptStatus, string> = {
  streaming: 'Generating…',
  done: 'Done',
  stopped: 'Stopped',
  error: 'Failed',
};

/**
 * Reference solution.
 *
 * Shape of the design:
 *  - One `AbortController` per mount, owned by the effect. Cleanup aborts it;
 *    there is no separate "cancelled" boolean. In StrictMode the effect runs
 *    twice, but each run gets its own controller so the surviving run is never
 *    poisoned by the first run's cleanup.
 *  - `for await…of` reads the injected iterable and checks `signal.aborted`
 *    after *every* await. The test source deliberately ignores the signal, so
 *    the guard is what keeps late chunks out after Stop / unmount.
 *  - Text accumulates in a local `full` string and is pushed with `setText(full)`.
 *    That avoids `setText(prev => prev + chunk)` races with any reset, and
 *    gives `onComplete` the exact final text without reading React state.
 *  - `onComplete` is read through a ref so a new callback identity on re-render
 *    does not restart the stream (the effect depends only on `source`).
 *  - Stop and the effect share the controller via a ref: Stop aborts and flips
 *    status to `stopped`; the loop then sees `aborted` and exits silently.
 */
export function StreamingTranscript({
  source,
  onComplete,
}: StreamingTranscriptProps): ReactElement {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<TranscriptStatus>('streaming');
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  // Latest callback without making it an effect dependency.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    controllerRef.current = controller;

    // A new source means a new stream: reset the panel for this run.
    setText('');
    setStatus('streaming');
    setError(null);

    (async () => {
      let full = '';
      try {
        for await (const chunk of source(signal)) {
          // Stopped or unmounted while we were awaiting this chunk: drop it.
          if (signal.aborted) return;
          full += chunk;
          setText(full);
        }
        if (signal.aborted) return;
        setStatus('done');
        onCompleteRef.current?.(full);
      } catch (err) {
        // An abort may surface as a rejection from a well-behaved source;
        // either way, nothing after abort may touch state.
        if (signal.aborted) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [source]);

  const isStreaming = status === 'streaming';

  const stop = () => {
    if (!isStreaming) return;
    controllerRef.current?.abort();
    setStatus('stopped');
  };

  return (
    <section aria-label="Streaming transcript">
      <div role="status">{STATUS_LABEL[status]}</div>
      {status === 'error' && error !== null && <div role="alert">{error}</div>}
      <p data-testid="transcript">{text}</p>
      <button type="button" onClick={stop} disabled={!isStreaming}>
        Stop
      </button>
    </section>
  );
}

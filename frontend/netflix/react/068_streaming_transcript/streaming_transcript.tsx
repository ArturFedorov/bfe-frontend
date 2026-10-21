import {ReactElement, useEffect, useRef, useState} from 'react';

export type TranscriptStatus = 'streaming' | 'done' | 'stopped' | 'error';

export interface StreamingTranscriptProps {
  /** Starts the stream. Must honour the signal: stop yielding once aborted. */
  source: (signal: AbortSignal) => AsyncIterable<string>;
  /** Called once with the full text when the stream completes normally. */
  onComplete?: (text: string) => void;
}

const STATUS_LABEL: Record<TranscriptStatus, string> = {
  streaming: 'Generating...',
  done: 'Done',
  stopped: 'Stopped',
  error: 'Failed',
}

export function StreamingTranscript({
  source,
  onComplete,
}: StreamingTranscriptProps): ReactElement {
  const [text, setText] = useState<string>('streaming');
  const [status, setStatus] = useState<TranscriptStatus>('streaming');
  const [error, setError] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const isStreaming = status === 'streaming';

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal} = controller;

    setStatus('streaming');
    setText('');
    setError('');

    (async () => {
      let full ='';
      try {
        for await (const chunk of source(abortRef.current!.signal)) {
          if(signal.aborted) return;
          full += chunk;
          setText(full);
        }

        if (signal.aborted) return;

        setStatus('done');
        onComplete?.(full);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    })()

    return () => controller.abort();
  }, [source])

  const stopStreaming = () => {
    setStatus('stopped');
    abortRef.current?.abort();
  }


  return (
    <div>
      <div role="status">{STATUS_LABEL[status]}</div>
      {status === 'error' && <div role="alert">{error}</div>}
      <p data-testid="transcript">{text}</p>
      <button disabled={!isStreaming} onClick={stopStreaming}>Stop</button>
    </div>
  )
}

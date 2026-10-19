import type { ReactElement } from 'react';

export type TranscriptStatus = 'streaming' | 'done' | 'stopped' | 'error';

export interface StreamingTranscriptProps {
  /** Starts the stream. Must honour the signal: stop yielding once aborted. */
  source: (signal: AbortSignal) => AsyncIterable<string>;
  /** Called once with the full text when the stream completes normally. */
  onComplete?: (text: string) => void;
}

export function StreamingTranscript({
  source,
  onComplete,
}: StreamingTranscriptProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

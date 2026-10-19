import { useState } from 'react';
import { StreamingTranscript } from './streaming_transcript';

/**
 * Demo harness for StreamingTranscript — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is streaming_transcript.test.tsx.
 */

const RATIONALE =
  'The highlighted span names a drug together with a quantity and a frequency, ' +
  'which matches the MEDICATION guideline rather than PROCEDURE. ' +
  'Two neighbouring annotators labelled near-identical spans the same way, ' +
  'so the suggestion is consistent with the batch.';

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const id = setTimeout(done, ms);
    function done() {
      signal.removeEventListener('abort', done);
      clearTimeout(id);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}

// Fake model stream: one word per chunk, 60–150ms apart, honours the signal.
async function* fakeRationale(signal: AbortSignal): AsyncIterable<string> {
  const words = RATIONALE.split(' ');
  for (let i = 0; i < words.length; i++) {
    await sleep(60 + Math.random() * 90, signal);
    if (signal.aborted) return;
    yield (i === 0 ? '' : ' ') + words[i];
  }
}

export default function Demo() {
  const [runKey, setRunKey] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);

  const restart = () => {
    setSaved(null);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Streaming Transcript</h2>
      <p className="demo-note">
        Implement <code>StreamingTranscript</code> in{' '}
        <code>streaming_transcript.tsx</code> — consume an injected async
        stream token by token, append without flicker or lost characters, let
        the annotator stop early, and never render after stop/unmount. The fake
        model emits one word every 60–150ms; Restart remounts the panel.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={restart}>Restart</button>
        </div>
        <StreamingTranscript
          key={runKey}
          source={fakeRationale}
          onComplete={(text) => setSaved(`Saved rationale (${text.length} chars)`)}
        />
        {saved && <p>{saved}</p>}
      </div>
    </div>
  );
}

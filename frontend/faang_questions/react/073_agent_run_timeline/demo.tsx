import { useRef, useState } from 'react';
import { AgentRunTimeline, RunEvent } from './agent_run_timeline';

/**
 * Demo harness for AgentRunTimeline — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is agent_run_timeline.test.tsx.
 */

const PIPELINE: Array<{ id: string; name: string; lines: string[] }> = [
  {
    id: 'fetch',
    name: 'Fetch items',
    lines: ['Querying batch-42…', '120 items pending annotation', 'Downloaded 120/120 images'],
  },
  {
    id: 'model',
    name: 'Call model',
    lines: [
      'Model: segmenter-v3 (gpu-pool-b)',
      'batch 1/4 → 30 predictions',
      'batch 2/4 → 30 predictions',
      'batch 3/4 → 30 predictions',
      'batch 4/4 → 30 predictions',
      'mean confidence 0.87',
    ],
  },
  {
    id: 'validate',
    name: 'Validate suggestions',
    lines: ['Checking label schema…', 'Checking bbox bounds…', 'Checking class coverage…', 'Checking duplicates…'],
  },
  {
    id: 'write',
    name: 'Write suggestions',
    lines: ['Opening transaction', 'Wrote 120 suggestion rows', 'Notified 3 reviewers'],
  },
];

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const id = setTimeout(done, ms);
    function done() {
      signal.removeEventListener('abort', done);
      clearTimeout(id);
      resolve();
    }
    signal.addEventListener('abort', done);
  });
}

export default function Demo() {
  // Every second run fails at the validate step so the Retry path is exercised.
  const runCount = useRef(0);
  const [runKey, setRunKey] = useState(0);

  async function* run(signal: AbortSignal): AsyncIterable<RunEvent> {
    runCount.current += 1;
    const shouldFail = runCount.current % 2 === 0;

    for (const step of PIPELINE) {
      if (signal.aborted) return;
      yield { type: 'step_started', stepId: step.id, name: step.name };

      for (const line of step.lines) {
        await sleep(200 + Math.random() * 200, signal);
        if (signal.aborted) return;
        yield { type: 'step_output', stepId: step.id, chunk: `${line}\n` };
      }

      if (shouldFail && step.id === 'validate') {
        yield { type: 'step_finished', stepId: step.id, status: 'error', message: 'Validation failed: 3 items' };
        yield { type: 'run_finished', status: 'failed' };
        return;
      }

      yield { type: 'step_finished', stepId: step.id, status: 'ok' };
    }

    yield { type: 'run_finished', status: 'succeeded' };
  }

  const restart = () => setRunKey((k) => k + 1);

  return (
    <div className="demo">
      <h2>Agent Run Timeline</h2>
      <p className="demo-note">
        Implement <code>AgentRunTimeline</code> in <code>agent_run_timeline.tsx</code> — consume
        the streamed run events into a per-step timeline with an elapsed clock, Cancel, and
        Retry. The fake pipeline streams 4 steps at 200–400ms per line; every second run fails
        at &quot;Validate suggestions&quot; so you can exercise Retry and the stale-run guard.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={restart}>Remount with a fresh run</button>
        </div>
        <AgentRunTimeline key={runKey} run={run} />
      </div>
    </div>
  );
}

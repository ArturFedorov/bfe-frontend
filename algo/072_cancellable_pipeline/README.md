# 072. Cancellable Async Pipeline

**Difficulty:** Hard
**Topics:** AbortSignal, Promises, Resource Cleanup

---

## Description

A video-import flow runs a fixed pipeline: download → transcode → generate
thumbnails → upload. Each step consumes the previous step's output, may
allocate resources (temp files, connections), and the user can cancel at any
moment. Build `runPipeline(steps, input, signal)`: it runs the steps in order,
feeding each step the previous result plus the shared `AbortSignal`. When the
signal aborts, the pipeline stops waiting on the current step, rejects with an
`AbortError`, and never starts the remaining steps. Every step that *started*
must have its `cleanup` callback run — on success, failure, or abort — before
the pipeline's promise settles.

## Examples

```ts
const steps: PipelineStep[] = [
  { run: (url, signal) => download(url, signal), cleanup: () => rmTempFile() },
  { run: (file, signal) => transcode(file, signal) },
  { run: (video) => upload(video), cleanup: () => closeConnection() },
];

const controller = new AbortController();
const result = runPipeline(steps, 'https://cdn/video.raw', controller.signal);

controller.abort();
await result; // rejects with AbortError; upload never started; cleanups ran
```

## Constraints

- Steps run strictly in sequence; step `i + 1` receives the fulfilled value of
  step `i` (step 0 receives `input`), and every step receives the signal.
- Abort rejects the pipeline with `AbortError` even if the current step's
  promise never settles; steps after the current one are never invoked.
- If the signal is already aborted, reject with `AbortError` before invoking
  any step (and run no cleanups — nothing started).
- `cleanup` runs exactly once for every step that started, in reverse start
  order, regardless of outcome; the pipeline promise settles only after all
  cleanups (including async ones) have completed.
- A step's own rejection propagates unchanged and skips the remaining steps
  (cleanups still run).
- An empty `steps` array resolves with `input`.

## Target

After abort: no further step starts, and every started step's cleanup runs
exactly once before the pipeline settles.

## Interviewer follow-up

Your abort rejects the pipeline while the current step's promise may still be
running in the background. What are the risks of that "abandon, don't await"
choice, and when would you instead wait for the step to acknowledge
cancellation before rejecting?

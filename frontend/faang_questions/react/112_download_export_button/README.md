# 112. Download Export Button

**Difficulty:** Medium
**Topics:** Polling, Async Jobs, Terminal States, Mock Backends, File Download

---

## Scenario

The partner dashboard has a "Download report" button. A report is too big to build inside one
request, so the backend works as an **async job**: `startExport()` returns a `jobId` right away,
and the client polls `getStatus(jobId)`. The job answers `waiting` some number of times, then
either `success` with a file URL or `failed` with a reason. On success the browser downloads the
file and polling stops.

You build both halves:

1. **`mock_export_source.ts`** — an in-memory mock backend so the UI can be built and tested
   before the real API exists. It returns `waiting` exactly `n` times, then the terminal result.
2. **`download_button.tsx`** — the button that starts the job, polls until a terminal status,
   and downloads the file.

Shared types live in `export_types.ts` (already written).

## Part 1 — `createMockExportSource(options)`

```ts
const source = createMockExportSource({ waitingCount: 2, url: '/files/q3.csv', fileName: 'q3.csv' });
const { jobId } = await source.startExport(); // { jobId: 'job-1' }
await source.getStatus(jobId); // { status: 'waiting' }
await source.getStatus(jobId); // { status: 'waiting' }
await source.getStatus(jobId); // { status: 'success', url: '/files/q3.csv', fileName: 'q3.csv' }
await source.getStatus(jobId); // same success again — terminal results are sticky
source.getStatusCallCount();   // 4
```

- `waitingCount` must be a non-negative integer, otherwise throw `RangeError` from the factory.
  `waitingCount: 0` means the first poll already returns the terminal result.
- Job ids are `'job-1'`, `'job-2'`, … in start order. **Every job counts its own polls**, so a
  second export starts again from `waiting`.
- Terminal result is `{ status: 'success', url, fileName }`. Defaults: `url`
  `'https://files.example.com/export.csv'`, `fileName` `'export.csv'`. If `failWith` is set the
  terminal result is `{ status: 'failed', error: failWith }` instead.
- Once a job is terminal, every later poll returns the same terminal result.
- `getStatus` for an unknown id rejects with `Error('Unknown job: <id>')`.
- `delayMs` (default `0`) simulates latency: each call settles after `delayMs` via `setTimeout`.
  With `0`, resolve without a timer (a resolved promise).
- `getStatusCallCount()` returns the total number of `getStatus` calls across all jobs.

## Part 2 — `<DownloadButton />`

```tsx
<DownloadButton
  api={source}            // { startExport, getStatus }
  label="Download report" // default 'Download'
  intervalMs={1000}       // default 1000
  maxPolls={30}           // default 30
  download={triggerDownload} // default: the triggerDownload helper below
/>
```

**Acceptance criteria**

- **Idle:** a `<button>` showing `label`. Nothing is called until it is clicked.
- **Start:** a click calls `api.startExport()` once. While the export runs the button is
  `disabled`, has `aria-busy="true"` and reads `Preparing…`. Clicking it again must not start a
  second job. Keep one `role="status"` element mounted at all times (a live region must exist
  before its text changes); it may read `Starting export…` until the job id arrives.
- **Poll:** as soon as `startExport` resolves, call `getStatus(jobId)` immediately. While it
  answers `waiting`, schedule the next poll `intervalMs` **after the previous response settles**
  (never overlap, never `setInterval`). Show `Waiting for file… (check <n>)` in a
  `role="status"` element, where `n` is the number of `waiting` answers so far.
- **Success:** stop polling, call `download(url, fileName)` **exactly once**, show
  `Download ready` in the status element and a fallback link
  `<a href={url} download={fileName}>Download did not start? Click here</a>`. The button is
  enabled again and reads `label`; clicking it starts a fresh export.
- **Failure:** a `failed` status, a rejected `getStatus` or a rejected `startExport` stops
  polling and shows `Export failed: <reason>` with `role="alert"` (for a rejection, the reason is
  the error's `message`). The button is enabled again and reads `Try again`.
- **Timeout:** after `maxPolls` `waiting` answers, stop and show `Export timed out` with
  `role="alert"`. The button reads `Try again`.
- **Retry:** a new click clears the old alert, link and check count, and starts a new job.
- **Unmount:** cancels everything — no further polls, no `download` call, no state updates.

**`triggerDownload(url, fileName)`** (exported from `download_button.tsx`): creates an `<a>` with
`href` and `download`, appends it to `document.body`, clicks it, and removes it.

## Target

40–50 minutes for both parts. Senior signals: a discriminated-union state
(`idle | starting | polling | success | error`), the settle-then-schedule loop with a cancelled
flag, one place that decides "terminal or keep going", and `download` firing once even under
React StrictMode double effects.

## Interviewer follow-up

1. The backend now sends `retryAfterMs` with each `waiting` answer. How do you honour it without
   breaking the no-overlap guarantee?
2. Users close the tab while a 3-minute export runs and come back later. How would you resume
   polling the same `jobId` instead of starting a new export?
3. Polling vs SSE vs WebSocket for this feature — which would you pick and why?

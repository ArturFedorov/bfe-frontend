import { ReactNode, useEffect, useRef, useState } from 'react';
import { DownloadButtonProps } from './download_button';

type DownloadState =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'polling'; checks: number }
  | { kind: 'success'; url: string; fileName: string }
  | { kind: 'error'; message: string };

const reasonOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function triggerDownload(url: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function DownloadButton({
  api,
  label = 'Download',
  intervalMs = 1000,
  maxPolls = 30,
  download = triggerDownload,
}: DownloadButtonProps): ReactNode {
  const [state, setState] = useState<DownloadState>({ kind: 'idle' });

  // Every run gets an id; bumping it invalidates whatever run is in flight.
  const runRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      runRef.current += 1;
      clearTimeout(timerRef.current);
    },
    [],
  );

  const busy = state.kind === 'starting' || state.kind === 'polling';

  const start = async () => {
    if (busy) return;

    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    clearTimeout(timerRef.current);
    setState({ kind: 'starting' });

    let jobId: string;
    try {
      ({ jobId } = await api.startExport());
    } catch (error) {
      if (alive()) {
        setState({
          kind: 'error',
          message: `Export failed: ${reasonOf(error)}`,
        });
      }
      return;
    }
    if (!alive()) return;

    let checks = 0;

    // Settle-then-schedule: the next poll is only queued after this one answers.
    const poll = async () => {
      let answer;
      try {
        answer = await api.getStatus(jobId);
      } catch (error) {
        if (alive()) {
          setState({
            kind: 'error',
            message: `Export failed: ${reasonOf(error)}`,
          });
        }
        return;
      }
      if (!alive()) return;

      switch (answer.status) {
        case 'success':
          setState({
            kind: 'success',
            url: answer.url,
            fileName: answer.fileName,
          });
          // Called from the loop, not an effect, so StrictMode can't fire it twice.
          download(answer.url, answer.fileName);
          return;
        case 'failed':
          setState({
            kind: 'error',
            message: `Export failed: ${answer.error}`,
          });
          return;
        case 'waiting':
          checks += 1;
          if (checks >= maxPolls) {
            setState({ kind: 'error', message: 'Export timed out' });
            return;
          }
          setState({ kind: 'polling', checks });
          timerRef.current = setTimeout(poll, intervalMs);
      }
    };

    await poll();
  };

  const statusText =
    state.kind === 'starting'
      ? 'Starting export…'
      : state.kind === 'polling'
        ? `Waiting for file… (check ${state.checks})`
        : state.kind === 'success'
          ? 'Download ready'
          : '';

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        aria-busy={busy || undefined}
      >
        {busy ? 'Preparing…' : state.kind === 'error' ? 'Try again' : label}
      </button>
      <p role="status">{statusText}</p>
      {state.kind === 'success' && (
        <a href={state.url} download={state.fileName}>
          Download did not start? Click here
        </a>
      )}
      {state.kind === 'error' && <p role="alert">{state.message}</p>}
    </div>
  );
}

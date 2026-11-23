/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DownloadButton, triggerDownload } from './download_button';
import { ExportApi, ExportStatus } from './export_types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const WAITING: ExportStatus = { status: 'waiting' };
const SUCCESS: ExportStatus = {
  status: 'success',
  url: 'https://files.example.com/q3.csv',
  fileName: 'q3.csv',
};

/** Scripted fake: answers come from `answers` in order; the last one repeats. */
function scriptedApi(answers: ExportStatus[]) {
  let jobs = 0;
  let index = 0;
  const api = {
    startExport: jest.fn(() => {
      jobs += 1;
      index = 0;
      return Promise.resolve({ jobId: `job-${jobs}` });
    }),
    getStatus: jest.fn((_jobId: string) => {
      const answer = answers[Math.min(index, answers.length - 1)];
      index += 1;
      return Promise.resolve(answer);
    }),
  } satisfies ExportApi;
  return api;
}

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
  await flush();
}

async function clickButton() {
  fireEvent.click(screen.getByRole('button'));
  await flush();
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('DownloadButton', () => {
  it('renders the label and calls nothing until clicked', () => {
    const api = scriptedApi([SUCCESS]);
    render(<DownloadButton api={api} label="Download report" />);

    const button = screen.getByRole('button', { name: 'Download report' });
    expect(button).toBeEnabled();
    expect(api.startExport).not.toHaveBeenCalled();
    expect(api.getStatus).not.toHaveBeenCalled();
  });

  it('defaults the label to Download', () => {
    render(<DownloadButton api={scriptedApi([SUCCESS])} />);
    expect(screen.getByRole('button')).toHaveTextContent('Download');
  });

  it('starts one job, disables the button and shows Preparing… while busy', async () => {
    const start = deferred<{ jobId: string }>();
    const api = scriptedApi([WAITING]);
    api.startExport.mockImplementationOnce(() => start.promise);
    render(<DownloadButton api={api} download={jest.fn()} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));

    const button = screen.getByRole('button');
    expect(api.startExport).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Preparing…');

    await act(async () => start.resolve({ jobId: 'job-7' }));
    await flush();

    expect(api.getStatus).toHaveBeenCalledTimes(1);
    expect(api.getStatus).toHaveBeenCalledWith('job-7');
  });

  it('polls every intervalMs after each response settles and counts checks', async () => {
    const api = scriptedApi([WAITING]);
    render(<DownloadButton api={api} intervalMs={1000} download={jest.fn()} />);

    await clickButton();
    expect(api.getStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Waiting for file… (check 1)',
    );

    await advance(999);
    expect(api.getStatus).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(api.getStatus).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Waiting for file… (check 2)',
    );
  });

  it('never overlaps polls while a status request is in flight', async () => {
    const api = scriptedApi([WAITING]);
    const slow = deferred<ExportStatus>();
    api.getStatus
      .mockImplementationOnce(() => Promise.resolve(WAITING))
      .mockImplementationOnce(() => slow.promise);
    render(<DownloadButton api={api} intervalMs={1000} download={jest.fn()} />);

    await clickButton();
    await advance(1000);
    expect(api.getStatus).toHaveBeenCalledTimes(2);

    // second request still in flight — time passing must not start a third
    await advance(10_000);
    expect(api.getStatus).toHaveBeenCalledTimes(2);

    await act(async () => slow.resolve(WAITING));
    await flush();
    await advance(1000);
    expect(api.getStatus).toHaveBeenCalledTimes(3);
  });

  it('stops polling on success and downloads exactly once', async () => {
    const api = scriptedApi([WAITING, WAITING, WAITING, SUCCESS]);
    const download = jest.fn();
    render(
      <DownloadButton
        api={api}
        label="Download report"
        intervalMs={1000}
        download={download}
      />,
    );

    await clickButton();
    await advance(1000);
    await advance(1000);
    expect(download).not.toHaveBeenCalled();
    await advance(1000);

    expect(api.getStatus).toHaveBeenCalledTimes(4);
    expect(download).toHaveBeenCalledTimes(1);
    expect(download).toHaveBeenCalledWith(
      'https://files.example.com/q3.csv',
      'q3.csv',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Download ready');

    await advance(60_000);
    expect(api.getStatus).toHaveBeenCalledTimes(4);
    expect(download).toHaveBeenCalledTimes(1);
  });

  it('shows a fallback link and re-enables the button after success', async () => {
    const api = scriptedApi([SUCCESS]);
    render(
      <DownloadButton api={api} label="Download report" download={jest.fn()} />,
    );

    await clickButton();

    const link = screen.getByRole('link', {
      name: 'Download did not start? Click here',
    });
    expect(link).toHaveAttribute('href', 'https://files.example.com/q3.csv');
    expect(link).toHaveAttribute('download', 'q3.csv');

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Download report');
  });

  it('starts a fresh export when clicked again after success', async () => {
    const api = scriptedApi([SUCCESS]);
    const download = jest.fn();
    render(<DownloadButton api={api} download={download} />);

    await clickButton();
    await clickButton();

    expect(api.startExport).toHaveBeenCalledTimes(2);
    expect(api.getStatus).toHaveBeenLastCalledWith('job-2');
    expect(download).toHaveBeenCalledTimes(2);
  });

  it('shows the failure reason and stops on a failed status', async () => {
    const api = scriptedApi([
      WAITING,
      { status: 'failed', error: 'disk full' },
    ]);
    render(<DownloadButton api={api} intervalMs={1000} download={jest.fn()} />);

    await clickButton();
    await advance(1000);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Export failed: disk full',
    );
    expect(screen.getByRole('button')).toBeEnabled();
    expect(screen.getByRole('button')).toHaveTextContent('Try again');

    await advance(60_000);
    expect(api.getStatus).toHaveBeenCalledTimes(2);
  });

  it('treats a rejected getStatus as a failure', async () => {
    const api = scriptedApi([WAITING]);
    api.getStatus.mockImplementationOnce(() =>
      Promise.reject(new Error('gateway timeout')),
    );
    const download = jest.fn();
    render(<DownloadButton api={api} download={download} />);

    await clickButton();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Export failed: gateway timeout',
    );
    await advance(60_000);
    expect(api.getStatus).toHaveBeenCalledTimes(1);
    expect(download).not.toHaveBeenCalled();
  });

  it('treats a rejected startExport as a failure', async () => {
    const api = scriptedApi([SUCCESS]);
    api.startExport.mockImplementationOnce(() =>
      Promise.reject(new Error('quota exceeded')),
    );
    render(<DownloadButton api={api} download={jest.fn()} />);

    await clickButton();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Export failed: quota exceeded',
    );
    expect(api.getStatus).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveTextContent('Try again');
  });

  it('times out after maxPolls waiting answers', async () => {
    const api = scriptedApi([WAITING]);
    const download = jest.fn();
    render(
      <DownloadButton
        api={api}
        intervalMs={1000}
        maxPolls={3}
        download={download}
      />,
    );

    await clickButton();
    await advance(1000);
    await advance(1000);

    expect(api.getStatus).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('alert')).toHaveTextContent('Export timed out');
    expect(screen.getByRole('button')).toHaveTextContent('Try again');

    await advance(60_000);
    expect(api.getStatus).toHaveBeenCalledTimes(3);
    expect(download).not.toHaveBeenCalled();
  });

  it('clears the old alert and check count when retrying', async () => {
    const api = scriptedApi([
      WAITING,
      { status: 'failed', error: 'disk full' },
    ]);
    render(<DownloadButton api={api} intervalMs={1000} download={jest.fn()} />);

    await clickButton();
    await advance(1000);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await clickButton();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(api.startExport).toHaveBeenCalledTimes(2);
    expect(api.getStatus).toHaveBeenLastCalledWith('job-2');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Waiting for file… (check 1)',
    );
  });

  it('cancels polling and never downloads after unmount', async () => {
    const api = scriptedApi([WAITING, SUCCESS]);
    const download = jest.fn();
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { unmount } = render(
      <DownloadButton api={api} intervalMs={1000} download={download} />,
    );

    await clickButton();
    expect(api.getStatus).toHaveBeenCalledTimes(1);

    unmount();
    await advance(60_000);

    expect(api.getStatus).toHaveBeenCalledTimes(1);
    expect(download).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not download after unmount even if a status request was in flight', async () => {
    const api = scriptedApi([WAITING]);
    const slow = deferred<ExportStatus>();
    api.getStatus.mockImplementationOnce(() => slow.promise);
    const download = jest.fn();
    const { unmount } = render(
      <DownloadButton api={api} download={download} />,
    );

    await clickButton();
    unmount();
    await act(async () => slow.resolve(SUCCESS));
    await flush();

    expect(download).not.toHaveBeenCalled();
  });
});

describe('triggerDownload', () => {
  it('clicks a temporary anchor with href and download, then removes it', () => {
    let clicked: HTMLAnchorElement | null = null;
    let wasAttached = false;
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked = this;
        wasAttached = document.body.contains(this);
      });

    triggerDownload('https://files.example.com/q3.csv', 'q3.csv');

    expect(click).toHaveBeenCalledTimes(1);
    expect(clicked).not.toBeNull();
    const anchor = clicked as unknown as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe(
      'https://files.example.com/q3.csv',
    );
    expect(anchor.getAttribute('download')).toBe('q3.csv');
    expect(wasAttached).toBe(true);
    expect(document.body.contains(anchor)).toBe(false);
    click.mockRestore();
  });
});

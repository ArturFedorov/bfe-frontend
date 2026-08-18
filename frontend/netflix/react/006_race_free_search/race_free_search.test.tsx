/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { ResultsPanel } from './race_free_search';
import type { SearchResult } from './race_free_search';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const AL_RESULTS: SearchResult[] = [{ id: 'p1', title: 'Almost Anything AB' }];
const ALPHA_RESULTS: SearchResult[] = [{ id: 'p7', title: 'Alphaline Media' }];

describe('ResultsPanel', () => {
  const fetchMock = jest.fn<Promise<Response>, [string]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('renders the idle prompt and does not fetch for an empty query', () => {
    render(<ResultsPanel query="" />);
    expect(screen.getByText('Type to search partners.')).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not fetch for a whitespace-only query', () => {
    render(<ResultsPanel query="   " />);
    expect(screen.getByText('Type to search partners.')).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches the encoded query and shows the loading state', () => {
    fetchMock.mockReturnValue(deferred<Response>().promise);
    render(<ResultsPanel query="dub house" />);
    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=dub%20house');
    expect(screen.getByRole('status')).toHaveTextContent('Searching…');
  });

  it('renders results on success', async () => {
    const request = deferred<Response>();
    fetchMock.mockReturnValue(request.promise);
    render(<ResultsPanel query="alpha" />);
    await act(async () => {
      request.resolve(jsonResponse(ALPHA_RESULTS));
    });
    const list = screen.getByRole('list', { name: 'Search results' });
    expect(list).toBeVisible();
    expect(screen.getByRole('listitem')).toHaveTextContent('Alphaline Media');
  });

  it('renders a distinct empty-results message', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    render(<ResultsPanel query="zzz" />);
    expect(await screen.findByText('No matches for "zzz".')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders an alert on a non-OK response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 503));
    render(<ResultsPanel query="alpha" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/503/);
  });

  it('renders an alert on a network rejection', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'));
    render(<ResultsPanel query="alpha" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  });

  it('refetches when the query prop changes', async () => {
    fetchMock.mockResolvedValue(jsonResponse(ALPHA_RESULTS));
    const { rerender } = render(<ResultsPanel query="al" />);
    rerender(<ResultsPanel query="alpha" />);
    await screen.findByRole('list', { name: 'Search results' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/search?q=al');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/search?q=alpha');
  });

  it('discards a slow old response that resolves after a fast new one', async () => {
    const slowOld = deferred<Response>();
    const fastNew = deferred<Response>();
    fetchMock.mockReturnValueOnce(slowOld.promise).mockReturnValueOnce(fastNew.promise);

    const { rerender } = render(<ResultsPanel query="al" />);
    rerender(<ResultsPanel query="alpha" />);

    await act(async () => {
      fastNew.resolve(jsonResponse(ALPHA_RESULTS));
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('Alphaline Media');

    await act(async () => {
      slowOld.resolve(jsonResponse(AL_RESULTS));
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('Alphaline Media');
    expect(screen.queryByText('Almost Anything AB')).not.toBeInTheDocument();
  });

  it('a late rejection of an outdated request does not clobber fresh results', async () => {
    const slowOld = deferred<Response>();
    const fastNew = deferred<Response>();
    fetchMock.mockReturnValueOnce(slowOld.promise).mockReturnValueOnce(fastNew.promise);

    const { rerender } = render(<ResultsPanel query="al" />);
    rerender(<ResultsPanel query="alpha" />);

    await act(async () => {
      fastNew.resolve(jsonResponse(ALPHA_RESULTS));
    });
    await act(async () => {
      slowOld.reject(new Error('timeout'));
    });
    expect(screen.getByRole('listitem')).toHaveTextContent('Alphaline Media');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ignores a response that lands after unmount', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const request = deferred<Response>();
    fetchMock.mockReturnValue(request.promise);
    const { unmount } = render(<ResultsPanel query="alpha" />);
    unmount();
    request.resolve(jsonResponse(ALPHA_RESULTS));
    await act(async () => {
      await Promise.resolve();
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { PartnerList } from './fetch_on_mount';
import type { Partner } from './fetch_on_mount';

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

const PARTNERS: Partner[] = [
  { id: 'p1', name: 'Pixelworks Studio' },
  { id: 'p2', name: 'Nordic Dub House' },
];

describe('PartnerList', () => {
  const fetchMock = jest.fn<Promise<Response>, [string]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('fetches the default endpoint exactly once on mount', async () => {
    fetchMock.mockResolvedValue(jsonResponse(PARTNERS));
    render(<PartnerList />);
    await screen.findByRole('list', { name: 'Partners' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/partners');
  });

  it('fetches a custom endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(PARTNERS));
    render(<PartnerList endpoint="/api/partners?region=emea" />);
    await screen.findByRole('list', { name: 'Partners' });
    expect(fetchMock).toHaveBeenCalledWith('/api/partners?region=emea');
  });

  it('shows the loading state while the request is pending', () => {
    const request = deferred<Response>();
    fetchMock.mockReturnValue(request.promise);
    render(<PartnerList />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading partners…');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders one listitem per partner on success', async () => {
    const request = deferred<Response>();
    fetchMock.mockReturnValue(request.promise);
    render(<PartnerList />);
    await act(async () => {
      request.resolve(jsonResponse(PARTNERS));
    });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Pixelworks Studio');
    expect(items[1]).toHaveTextContent('Nordic Dub House');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the empty state for an empty list, not an error', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    render(<PartnerList />);
    expect(await screen.findByText('No partners found.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders an alert for a non-OK HTTP response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 500));
    render(<PartnerList />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/500/);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders an alert for a network rejection', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'));
    render(<PartnerList />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  });

  it('ignores a response that lands after unmount', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const request = deferred<Response>();
    fetchMock.mockReturnValue(request.promise);
    const { unmount } = render(<PartnerList />);
    unmount();
    request.resolve(jsonResponse(PARTNERS));
    await act(async () => {
      await Promise.resolve();
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

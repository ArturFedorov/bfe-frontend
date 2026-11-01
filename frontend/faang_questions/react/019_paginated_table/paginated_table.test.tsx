/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginatedTable, Delivery, PageResult, FetchPageParams } from './paginated_table';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const page1: Delivery[] = [
  { id: 'd1', title: 'Stranger Things S5 E1', status: 'delivered' },
  { id: 'd2', title: 'Stranger Things S5 E2', status: 'processing' },
];
const page2: Delivery[] = [
  { id: 'd3', title: 'The Crown S7 E1', status: 'delivered' },
  { id: 'd4', title: 'The Crown S7 E2', status: 'failed' },
];
const failedOnly: Delivery[] = [
  { id: 'd4', title: 'The Crown S7 E2', status: 'failed' },
];

function setup() {
  const calls: Array<ReturnType<typeof deferred<PageResult>>> = [];
  const fetchPage = jest.fn((_params: FetchPageParams) => {
    const d = deferred<PageResult>();
    calls.push(d);
    return d.promise;
  });
  const utils = render(<PaginatedTable fetchPage={fetchPage} pageSize={2} />);
  return { calls, fetchPage, ...utils };
}

describe('PaginatedTable', () => {
  it('fetches page 1 with default params on mount and shows a loading row', async () => {
    const { calls, fetchPage } = setup();

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({ page: 1, pageSize: 2, status: 'all' });
    expect(screen.getByText('Loading deliveries…')).toBeInTheDocument();

    calls[0].resolve({ rows: page1, total: 6 });

    expect(await screen.findByText('Stranger Things S5 E1')).toBeInTheDocument();
    expect(screen.getByText('Stranger Things S5 E2')).toBeInTheDocument();
    expect(screen.queryByText('Loading deliveries…')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3 · 6 deliveries')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('disables Previous on page 1 and Next on the last page', async () => {
    const { calls } = setup();
    calls[0].resolve({ rows: page1, total: 2 }); // total 2 with pageSize 2 → 1 page

    expect(await screen.findByText('Page 1 of 1 · 2 deliveries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('fetches the next page with the right params when Next is clicked', async () => {
    const user = userEvent.setup();
    const { calls, fetchPage } = setup();
    calls[0].resolve({ rows: page1, total: 6 });
    await screen.findByText('Stranger Things S5 E1');

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenLastCalledWith({ page: 2, pageSize: 2, status: 'all' });
    expect(screen.getByText('Loading deliveries…')).toBeInTheDocument();

    calls[1].resolve({ rows: page2, total: 6 });

    expect(await screen.findByText('The Crown S7 E1')).toBeInTheDocument();
    expect(screen.queryByText('Stranger Things S5 E1')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3 · 6 deliveries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });

  it('resets to page 1 when the status filter changes', async () => {
    const user = userEvent.setup();
    const { calls, fetchPage } = setup();
    calls[0].resolve({ rows: page1, total: 6 });
    await screen.findByText('Stranger Things S5 E1');

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    calls[1].resolve({ rows: page2, total: 6 });
    await screen.findByText('Page 2 of 3 · 6 deliveries');

    await user.selectOptions(screen.getByLabelText('Status'), 'failed');

    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenLastCalledWith({ page: 1, pageSize: 2, status: 'failed' });

    calls[2].resolve({ rows: failedOnly, total: 1 });

    expect(await screen.findByText('Page 1 of 1 · 1 deliveries')).toBeInTheDocument();
    expect(screen.getByText('The Crown S7 E2')).toBeInTheDocument();
    expect(screen.queryByText('The Crown S7 E1')).not.toBeInTheDocument();
  });

  it('ignores a stale page response that resolves after a newer request', async () => {
    const user = userEvent.setup();
    const { calls, fetchPage } = setup();
    calls[0].resolve({ rows: page1, total: 6 });
    await screen.findByText('Stranger Things S5 E1');

    // request page 2, but change the filter before it resolves
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'failed');
    expect(fetchPage).toHaveBeenCalledTimes(3);

    // newest request (filtered, page 1) resolves first
    calls[2].resolve({ rows: failedOnly, total: 1 });
    expect(await screen.findByText('Page 1 of 1 · 1 deliveries')).toBeInTheDocument();

    // stale page-2 response resolves last — it must not win
    calls[1].resolve({ rows: page2, total: 6 });
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.getByText('Page 1 of 1 · 1 deliveries')).toBeInTheDocument();
    expect(screen.getByText('The Crown S7 E2')).toBeInTheDocument();
    expect(screen.queryByText('The Crown S7 E1')).not.toBeInTheDocument();
    expect(screen.queryByText('Page 2 of 3 · 6 deliveries')).not.toBeInTheDocument();
  });
});

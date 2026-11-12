/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi, type Api } from '../../shell/api';
import { campaigns as fixtureCampaigns } from '../../shell/fixtures';
import { SessionProvider } from '../../shell/session';
import type { Role } from '../../shell/types';
import { CampaignsPage } from './CampaignsPage';
import { createQueryClient, QueryClientProvider } from './query';

function renderPage(api: Api, role: Role = 'editor', pageSize = 10) {
  const client = createQueryClient();
  return render(
    <SessionProvider initial={{ user: { id: 'u9', name: 'Test User', role } }}>
      <QueryClientProvider client={client}>
        <CampaignsPage api={api} pageSize={pageSize} />
      </QueryClientProvider>
    </SessionProvider>,
  );
}

/** Rows of the campaigns table, header excluded. */
function dataRows() {
  const table = screen.getByRole('table');
  return within(table).getAllByRole('row').slice(1);
}

const byUpdatedDesc = [...fixtureCampaigns].sort((a, b) =>
  a.updatedAt === b.updatedAt
    ? a.id < b.id
      ? -1
      : 1
    : a.updatedAt < b.updatedAt
      ? 1
      : -1,
);

describe('02 — CampaignsPage', () => {
  it('lists the first page sorted by updatedAt desc with a page indicator; editors get no approve control', async () => {
    const api = createApi({ latencyMs: 0 });
    renderPage(api);
    const expected = byUpdatedDesc.slice(0, 10);
    await screen.findByRole('row', { name: new RegExp(expected[0].name) });
    const rows = dataRows();
    expect(rows).toHaveLength(10);
    expected.forEach((c, i) => expect(rows[i]).toHaveTextContent(c.name));
    expect(screen.getByRole('status')).toHaveTextContent(/Page 1 of 4/);
    expect(
      screen.queryByRole('button', { name: /approve selected/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('the Status filter narrows the rows and resets to page 1', async () => {
    const api = createApi({ latencyMs: 0 });
    const user = userEvent.setup();
    renderPage(api);
    await screen.findByRole('row', { name: new RegExp(byUpdatedDesc[0].name) });

    await user.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText(/Page 2 of 4/);

    await user.selectOptions(
      screen.getByRole('combobox', { name: /status/i }),
      'completed',
    );
    const completed = fixtureCampaigns.filter((c) => c.status === 'completed');
    const pages = Math.ceil(completed.length / 10);
    await screen.findByText(new RegExp(`Page 1 of ${pages}`));
    const rows = dataRows();
    expect(rows.length).toBe(Math.min(10, completed.length));
    rows.forEach((row) => expect(row).toHaveTextContent(/completed/i));
  });

  it('Prev/Next paginate; Prev is disabled on the first page and Next on the last', async () => {
    const api = createApi({ latencyMs: 0 });
    const user = userEvent.setup();
    renderPage(api, 'editor', 15); // 40 / 15 → 3 pages
    await screen.findByText(/Page 1 of 3/);
    const prev = screen.getByRole('button', { name: /prev/i });
    const next = screen.getByRole('button', { name: /next/i });
    expect(prev).toBeDisabled();

    await user.click(next);
    await screen.findByText(/Page 2 of 3/);
    expect(dataRows()[0]).toHaveTextContent(byUpdatedDesc[15].name);
    expect(api.calls.listCampaigns).toBe(2);

    await user.click(next);
    await screen.findByText(/Page 3 of 3/);
    expect(dataRows()).toHaveLength(10);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /prev/i }));
    await screen.findByText(/Page 2 of 3/);
    // page 2 came from the cache: no new request for a key we already have…
    // …but SWR still revalidates it in the background, so allow exactly one extra call
    expect(api.calls.listCampaigns).toBeLessThanOrEqual(4);
    expect(dataRows()[0]).toHaveTextContent(byUpdatedDesc[15].name);
  });

  it('approvers can approve selected pending campaigns optimistically, with rollback and an alert on failure', async () => {
    const api = createApi({ latencyMs: 30 });
    const user = userEvent.setup();
    renderPage(api, 'approver', 100);
    const pending = fixtureCampaigns.filter(
      (c) => c.status === 'pending_approval',
    );
    await screen.findByRole('row', { name: new RegExp(pending[0].name) });

    const approve = screen.getByRole('button', { name: /approve selected/i });
    expect(approve).toBeDisabled(); // nothing selected yet

    const target = pending[0];
    const row = screen.getByRole('row', { name: new RegExp(target.name) });
    await user.click(
      within(row).getByRole('checkbox', {
        name: new RegExp(`select ${target.name}`, 'i'),
      }),
    );
    expect(approve).toBeEnabled();

    // happy path
    await user.click(approve);
    await waitFor(() =>
      expect(
        screen.getByRole('row', { name: new RegExp(target.name) }),
      ).toHaveTextContent(/scheduled/i),
    );
    expect(api.calls.approveCampaigns).toBe(1);

    // failure path: optimistic flip, then rollback + alert
    const second = pending[1];
    const row2 = screen.getByRole('row', { name: new RegExp(second.name) });
    await user.click(
      within(row2).getByRole('checkbox', {
        name: new RegExp(`select ${second.name}`, 'i'),
      }),
    );
    api.setOptions({ failureRate: 1 });
    await user.click(screen.getByRole('button', { name: /approve selected/i }));
    expect(
      screen.getByRole('row', { name: new RegExp(second.name) }),
    ).toHaveTextContent(/scheduled/i);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/network error/i);
    await waitFor(() =>
      expect(
        screen.getByRole('row', { name: new RegExp(second.name) }),
      ).toHaveTextContent(/pending/i),
    );
  });
});

import { ApiError, createApi } from './api';
import { campaigns as fixtureCampaigns, customers } from './fixtures';

describe('shell/api — fake backend', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('honours latencyMs: the promise does not settle before the timer fires', async () => {
    const api = createApi({ latencyMs: 500 });
    const settled = jest.fn();
    api.listCustomers().then(settled);

    await jest.advanceTimersByTimeAsync(499);
    expect(settled).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(settled).toHaveBeenCalledTimes(1);
    expect(settled.mock.calls[0][0]).toHaveLength(customers.length);
  });

  it('pages, filters and sorts campaigns', async () => {
    const api = createApi();
    const p1 = api.listCampaigns({ page: 1, pageSize: 10 });
    const p2 = api.listCampaigns({ page: 2, pageSize: 10 });
    await jest.runAllTimersAsync();
    const [first, second] = await Promise.all([p1, p2]);

    expect(first.total).toBe(fixtureCampaigns.length);
    expect(first.items).toHaveLength(10);
    expect(second.items).toHaveLength(10);
    expect(
      new Set([...first.items, ...second.items].map((c) => c.id)).size,
    ).toBe(20);
    // default sort: updatedAt desc
    const times = first.items.map((c) => Date.parse(c.updatedAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const pending = api.listCampaigns({
      status: 'pending_approval',
      pageSize: 100,
    });
    await jest.runAllTimersAsync();
    const page = await pending;
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((c) => c.status === 'pending_approval')).toBe(true);
    expect(page.total).toBe(
      fixtureCampaigns.filter((c) => c.status === 'pending_approval').length,
    );

    const byName = api.listCampaigns({
      sort: { field: 'name', dir: 'asc' },
      pageSize: 5,
    });
    await jest.runAllTimersAsync();
    const names = (await byName).items.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('returns clones: mutating a response does not change the store', async () => {
    const api = createApi();
    const p = api.getCampaign('c01');
    await jest.runAllTimersAsync();
    const c = await p;
    c.name = 'MUTATED';
    const again = api.getCampaign('c01');
    await jest.runAllTimersAsync();
    expect((await again).name).not.toBe('MUTATED');
  });

  it('updateCampaign patches and stamps updatedAt; unknown ids reject with NOT_FOUND', async () => {
    const api = createApi();
    const p = api.updateCampaign('c02', { name: 'Renamed' });
    await jest.runAllTimersAsync();
    const updated = await p;
    expect(updated.name).toBe('Renamed');
    expect(updated.id).toBe('c02');

    const missing = api.getCampaign('nope');
    missing.catch(() => {}); // avoid unhandled rejection noise before we assert
    await jest.runAllTimersAsync();
    await expect(missing).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('approveCampaigns moves pending campaigns to scheduled and rejects a non-pending batch with CONFLICT', async () => {
    const api = createApi();
    const pending = fixtureCampaigns
      .filter((c) => c.status === 'pending_approval')
      .slice(0, 2);
    const other = fixtureCampaigns.find((c) => c.status === 'completed')!;

    const ok = api.approveCampaigns(pending.map((c) => c.id));
    await jest.runAllTimersAsync();
    const approved = await ok;
    expect(approved.map((c) => c.status)).toEqual(['scheduled', 'scheduled']);

    const bad = api.approveCampaigns([other.id]);
    bad.catch(() => {});
    await jest.runAllTimersAsync();
    await expect(bad).rejects.toBeInstanceOf(ApiError);
    await expect(bad).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('failureRate is deterministic for a given seed and resets with reset()', async () => {
    async function outcomes(seed: number): Promise<string[]> {
      const api = createApi({ failureRate: 0.5, seed });
      const results: string[] = [];
      for (let i = 0; i < 8; i++) {
        const p = api.listBlocks();
        p.catch(() => {});
        await jest.runAllTimersAsync();
        results.push(
          await p.then(
            () => 'ok',
            (e: ApiError) => e.code,
          ),
        );
      }
      return results;
    }
    const a = await outcomes(7);
    const b = await outcomes(7);
    expect(a).toEqual(b);
    expect(a).toContain('ok');
    expect(a).toContain('NETWORK');

    const c = await outcomes(8);
    expect(c).not.toEqual(a);

    // reset() rewinds the PRNG, so the sequence starts over.
    const api = createApi({ failureRate: 0.5, seed: 7 });
    const firstRun: string[] = [];
    for (let i = 0; i < 4; i++) {
      const p = api.listBlocks();
      p.catch(() => {});
      await jest.runAllTimersAsync();
      firstRun.push(
        await p.then(
          () => 'ok',
          (e: ApiError) => e.code,
        ),
      );
    }
    api.reset();
    const secondRun: string[] = [];
    for (let i = 0; i < 4; i++) {
      const p = api.listBlocks();
      p.catch(() => {});
      await jest.runAllTimersAsync();
      secondRun.push(
        await p.then(
          () => 'ok',
          (e: ApiError) => e.code,
        ),
      );
    }
    expect(secondRun).toEqual(firstRun);
    expect(api.calls.listBlocks).toBe(4);
  });

  it('saveTemplate / saveJourney upsert and reset() restores fixtures', async () => {
    const api = createApi();
    const save = api.saveTemplate({
      id: 't99',
      name: 'New',
      channel: 'sms',
      body: 'hi',
      updatedAt: '',
    });
    await jest.runAllTimersAsync();
    expect((await save).updatedAt).not.toBe('');

    const list = api.listTemplates();
    await jest.runAllTimersAsync();
    expect((await list).some((t) => t.id === 't99')).toBe(true);

    const j = api.getJourney('j1');
    await jest.runAllTimersAsync();
    const journey = await j;
    const saved = api.saveJourney({ ...journey, name: 'Renamed journey' });
    await jest.runAllTimersAsync();
    expect((await saved).name).toBe('Renamed journey');

    api.reset();
    const after = api.listTemplates();
    const j1 = api.getJourney('j1');
    await jest.runAllTimersAsync();
    expect((await after).some((t) => t.id === 't99')).toBe(false);
    expect((await j1).name).toBe('Welcome series');
    expect(api.calls.listTemplates).toBe(1);
  });
});

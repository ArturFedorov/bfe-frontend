import {
  CampaignEvent,
  CampaignState,
  initialState,
  apply,
  rebuild,
  snapshot,
  rebuildFrom,
} from './event_sourced_campaign';

const baseEvents: CampaignEvent[] = [
  { eventId: 'e1', seq: 1, type: 'created', name: 'Spring Sale' },
  { eventId: 'e2', seq: 2, type: 'audience_set', segmentId: 'seg:vip' },
  { eventId: 'e3', seq: 3, type: 'scheduled', startAt: '2026-03-01T09:00:00Z' },
  { eventId: 'e4', seq: 4, type: 'sent', count: 120 },
  { eventId: 'e5', seq: 5, type: 'sent', count: 80 },
  { eventId: 'e6', seq: 6, type: 'paused' },
];

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    for (const v of Object.values(obj as object)) deepFreeze(v);
  }
  return obj;
}

/** A long, realistic log: created, scheduled, then n-2 sends with a pause/resume sprinkled in. */
function longLog(n: number): CampaignEvent[] {
  const out: CampaignEvent[] = [
    { eventId: 'ev-1', seq: 1, type: 'created', name: 'Big Drop' },
    {
      eventId: 'ev-2',
      seq: 2,
      type: 'scheduled',
      startAt: '2026-05-01T00:00:00Z',
    },
  ];
  for (let seq = 3; seq <= n; seq++) {
    const id = `ev-${seq}`;
    if (seq % 100 === 0) out.push({ eventId: id, seq, type: 'paused' });
    else if (seq % 100 === 1) out.push({ eventId: id, seq, type: 'resumed' });
    else out.push({ eventId: id, seq, type: 'sent', count: 1 });
  }
  return out;
}

describe('rebuild — happy path', () => {
  it('folds a log into the expected state', () => {
    expect(rebuild(baseEvents)).toEqual({
      exists: true,
      name: 'Spring Sale',
      segmentId: 'seg:vip',
      startAt: '2026-03-01T09:00:00Z',
      status: 'paused',
      sentCount: 200,
      lastSeq: 6,
      seenEventIds: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'],
    });
  });

  it('rebuild([]) deep-equals initialState', () => {
    expect(rebuild([])).toEqual(initialState);
    expect(rebuild([])).toEqual({
      exists: false,
      name: '',
      segmentId: null,
      startAt: null,
      status: 'draft',
      sentCount: 0,
      lastSeq: 0,
      seenEventIds: [],
    });
  });

  it('renames and moves scheduled -> sending on the first send', () => {
    const s = rebuild([
      { eventId: 'a', seq: 1, type: 'created', name: 'Old' },
      { eventId: 'b', seq: 2, type: 'renamed', name: 'New' },
      {
        eventId: 'c',
        seq: 3,
        type: 'scheduled',
        startAt: '2026-01-01T00:00:00Z',
      },
    ]);
    expect(s.name).toBe('New');
    expect(s.status).toBe('scheduled');
    const sending = apply(s, { eventId: 'd', seq: 4, type: 'sent', count: 1 });
    expect(sending.status).toBe('sending');
    expect(sending.sentCount).toBe(1);
  });
});

describe('apply — idempotency and ordering', () => {
  let s: CampaignState;
  beforeAll(() => {
    s = rebuild(baseEvents);
  });

  it('returns the same reference for a duplicate eventId', () => {
    expect(apply(s, baseEvents[3])).toBe(s);
    // same id, different payload: still a duplicate
    expect(apply(s, { eventId: 'e4', seq: 4, type: 'sent', count: 999 })).toBe(
      s,
    );
  });

  it('returns the same reference for a stale seq with a new id', () => {
    expect(
      apply(s, { eventId: 'late', seq: 4, type: 'renamed', name: 'X' }),
    ).toBe(s);
    expect(
      apply(s, { eventId: 'late2', seq: 6, type: 'renamed', name: 'X' }),
    ).toBe(s);
  });

  it('consumes a fresh event: new reference, lastSeq and seenEventIds advance', () => {
    const next = apply(s, {
      eventId: 'e7',
      seq: 7,
      type: 'renamed',
      name: 'Spring Sale 2',
    });
    expect(next).not.toBe(s);
    expect(next.name).toBe('Spring Sale 2');
    expect(next.lastSeq).toBe(7);
    expect(next.seenEventIds).toEqual([...s.seenEventIds, 'e7']);
  });

  it('does not mutate the input state or event', () => {
    const frozen = deepFreeze(rebuild(baseEvents.slice(0, 3)));
    const event = deepFreeze<CampaignEvent>({
      eventId: 'x',
      seq: 4,
      type: 'sent',
      count: 3,
    });
    const next = apply(frozen, event);
    expect(next.sentCount).toBe(3);
    expect(frozen.sentCount).toBe(0);
    expect(frozen.seenEventIds).toEqual(['e1', 'e2', 'e3']);
  });
});

describe('apply — state machine', () => {
  it('paused/resumed toggle, resuming to sending when sends happened', () => {
    const paused = rebuild(baseEvents);
    const resumed = apply(paused, { eventId: 'e7', seq: 7, type: 'resumed' });
    expect(resumed.status).toBe('sending');
    const pausedAgain = apply(resumed, {
      eventId: 'e8',
      seq: 8,
      type: 'paused',
    });
    expect(pausedAgain.status).toBe('paused');
  });

  it('resumes to scheduled when nothing was sent yet', () => {
    const s = rebuild([
      { eventId: 'a', seq: 1, type: 'created', name: 'C' },
      {
        eventId: 'b',
        seq: 2,
        type: 'scheduled',
        startAt: '2026-01-01T00:00:00Z',
      },
      { eventId: 'c', seq: 3, type: 'paused' },
      { eventId: 'd', seq: 4, type: 'resumed' },
    ]);
    expect(s.status).toBe('scheduled');
  });

  it('ignores invalid transitions but still advances lastSeq', () => {
    const draft = rebuild([
      { eventId: 'a', seq: 1, type: 'created', name: 'C' },
    ]);

    const resumed = apply(draft, { eventId: 'b', seq: 2, type: 'resumed' });
    expect(resumed.status).toBe('draft');
    expect(resumed.lastSeq).toBe(2);
    expect(resumed).not.toBe(draft);

    const sentInDraft = apply(resumed, {
      eventId: 'c',
      seq: 3,
      type: 'sent',
      count: 10,
    });
    expect(sentInDraft.sentCount).toBe(0);
    expect(sentInDraft.status).toBe('draft');
    expect(sentInDraft.lastSeq).toBe(3);

    const pausedInDraft = apply(sentInDraft, {
      eventId: 'd',
      seq: 4,
      type: 'paused',
    });
    expect(pausedInDraft.status).toBe('draft');
    expect(pausedInDraft.lastSeq).toBe(4);
  });

  it('ignores a second created and anything before created', () => {
    const s0 = apply(initialState, {
      eventId: 'x',
      seq: 1,
      type: 'renamed',
      name: 'Nope',
    });
    expect(s0.exists).toBe(false);
    expect(s0.name).toBe('');
    expect(s0.lastSeq).toBe(1);

    const s1 = apply(s0, {
      eventId: 'y',
      seq: 2,
      type: 'created',
      name: 'Real',
    });
    const s2 = apply(s1, {
      eventId: 'z',
      seq: 3,
      type: 'created',
      name: 'Again',
    });
    expect(s2.name).toBe('Real');
    expect(s2.lastSeq).toBe(3);
  });

  it('does not allow scheduling while sending or paused', () => {
    const paused = rebuild(baseEvents);
    const s = apply(paused, {
      eventId: 'r',
      seq: 7,
      type: 'scheduled',
      startAt: '2027-01-01T00:00:00Z',
    });
    expect(s.status).toBe('paused');
    expect(s.startAt).toBe('2026-03-01T09:00:00Z');
    expect(s.lastSeq).toBe(7);
  });

  it('archived is terminal: later events are consumed but have no effect', () => {
    const archived = apply(rebuild(baseEvents), {
      eventId: 'e7',
      seq: 7,
      type: 'archived',
    });
    expect(archived.status).toBe('archived');

    const after = apply(archived, {
      eventId: 'e8',
      seq: 8,
      type: 'sent',
      count: 5,
    });
    expect(after).not.toBe(archived);
    expect(after.status).toBe('archived');
    expect(after.sentCount).toBe(200);
    expect(after.lastSeq).toBe(8);
    expect(after.seenEventIds).toContain('e8');

    const renamed = apply(after, {
      eventId: 'e9',
      seq: 9,
      type: 'renamed',
      name: 'Zombie',
    });
    expect(renamed.name).toBe('Spring Sale');
    expect(renamed.lastSeq).toBe(9);
  });

  it('duplicates after archive still return the same reference', () => {
    const archived = apply(rebuild(baseEvents), {
      eventId: 'e7',
      seq: 7,
      type: 'archived',
    });
    expect(apply(archived, baseEvents[0])).toBe(archived);
    expect(apply(archived, { eventId: 'e7', seq: 7, type: 'archived' })).toBe(
      archived,
    );
  });

  it('can archive from any live status', () => {
    for (const prefix of [1, 3, 4, 6]) {
      const s = apply(rebuild(baseEvents.slice(0, prefix)), {
        eventId: 'arch',
        seq: prefix + 1,
        type: 'archived',
      });
      expect(s.status).toBe('archived');
    }
  });
});

describe('snapshot and rebuildFrom', () => {
  it('snapshot is a detached deep copy', () => {
    const s = rebuild(baseEvents);
    const snap = snapshot(s);
    expect(snap.version).toBe(1);
    expect(snap.state).toEqual(s);
    expect(snap.state).not.toBe(s);
    snap.state.seenEventIds.push('tampered');
    (snap.state as CampaignState).name = 'tampered';
    expect(s.seenEventIds).not.toContain('tampered');
    expect(s.name).toBe('Spring Sale');
  });

  it('rebuildFrom(snapshot, []) equals the snapshotted state', () => {
    const s = rebuild(baseEvents);
    expect(rebuildFrom(snapshot(s), [])).toEqual(s);
  });

  it('snapshot + tail equals full rebuild for every split point', () => {
    const full = rebuild(baseEvents);
    for (let k = 0; k <= baseEvents.length; k++) {
      const snap = snapshot(rebuild(baseEvents.slice(0, k)));
      expect(rebuildFrom(snap, baseEvents.slice(k))).toEqual(full);
    }
  });

  it('tolerates an overlapping tail (events already in the snapshot)', () => {
    const full = rebuild(baseEvents);
    const snap = snapshot(rebuild(baseEvents.slice(0, 4)));
    expect(rebuildFrom(snap, baseEvents.slice(2))).toEqual(full);
    expect(rebuildFrom(snap, baseEvents)).toEqual(full);
  });

  it('survives a JSON round-trip', () => {
    const full = rebuild(baseEvents);
    const snap = JSON.parse(
      JSON.stringify(snapshot(rebuild(baseEvents.slice(0, 3)))),
    );
    expect(rebuildFrom(snap, baseEvents.slice(3))).toEqual(full);
  });
});

describe('memory bound and scale', () => {
  it('caps seenEventIds at the last 1000 ids after 1500 events', () => {
    const log = longLog(1500);
    const s = rebuild(log);
    expect(s.lastSeq).toBe(1500);
    expect(s.seenEventIds).toHaveLength(1000);
    expect(s.seenEventIds[0]).toBe('ev-501');
    expect(s.seenEventIds[999]).toBe('ev-1500');
    expect(s.seenEventIds).not.toContain('ev-500');
  });

  it('still rejects a replay of an event that fell out of the id window', () => {
    const log = longLog(1500);
    const s = rebuild(log);
    expect(apply(s, log[0])).toBe(s); // ev-1, long gone from seenEventIds
    expect(apply(s, log[499])).toBe(s); // ev-500, just outside the window
  });

  it('snapshot + tail equals full rebuild across the 1000-id boundary', () => {
    const log = longLog(1500);
    const full = rebuild(log);
    for (const k of [0, 250, 1000, 1200, 1499]) {
      const snap = snapshot(rebuild(log.slice(0, k)));
      expect(rebuildFrom(snap, log.slice(k))).toEqual(full);
    }
  });

  it('rebuilds 100k events in linear time', () => {
    const log = longLog(100_000);
    const startedAt = Date.now();
    const s = rebuild(log);
    expect(Date.now() - startedAt).toBeLessThan(2000);
    expect(s.lastSeq).toBe(100_000);
    expect(s.seenEventIds).toHaveLength(1000);
    expect(s.sentCount).toBeGreaterThan(0);
  });
});

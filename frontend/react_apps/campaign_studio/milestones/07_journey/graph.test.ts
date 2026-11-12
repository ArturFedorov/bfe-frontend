import { journeys } from '../../shell/fixtures';
import type { Journey } from '../../shell/types';
import { findCycle, topoOrder, unreachable, validateJourney } from './graph';

const [welcome, winBack] = journeys; // j1 is a clean DAG, j2 has a cycle and an unreachable node

function journey(partial: Pick<Journey, 'nodes' | 'edges'>): Journey {
  return {
    id: 'test',
    name: 'Test',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('graph — topoOrder', () => {
  it('orders j1 deterministically (ready nodes in definition order) and returns null on a cycle', () => {
    expect(topoOrder(welcome)).toEqual([
      'start',
      'welcome',
      'wait2d',
      'opened',
      'offer',
      'nudge',
      'done',
    ]);
    expect(topoOrder(winBack)).toBeNull();

    // two independent chains interleave by definition order, not by edge order
    const forked = journey({
      nodes: [
        { id: 'a', type: 'entry', label: 'A' },
        { id: 'z', type: 'exit', label: 'Z' },
        { id: 'b', type: 'send', label: 'B' },
        { id: 'c', type: 'send', label: 'C' },
      ],
      edges: [
        { from: 'c', to: 'z' },
        { from: 'b', to: 'c' },
        { from: 'a', to: 'b' },
        { from: 'ghost', to: 'z' }, // unknown endpoint — ignored
      ],
    });
    expect(topoOrder(forked)).toEqual(['a', 'b', 'c', 'z']);
  });
});

describe('graph — findCycle / unreachable', () => {
  it('findCycle returns a closed walk along real edges, or null', () => {
    expect(findCycle(welcome)).toBeNull();
    const cycle = findCycle(winBack)!;
    expect(cycle).not.toBeNull();
    expect(cycle.length).toBeGreaterThanOrEqual(3);
    expect(cycle[0]).toBe(cycle[cycle.length - 1]);
    expect(new Set(cycle)).toEqual(new Set(['offer', 'wait', 'bought']));
    for (let i = 0; i < cycle.length - 1; i++) {
      expect(
        winBack.edges.some((e) => e.from === cycle[i] && e.to === cycle[i + 1]),
      ).toBe(true);
    }
  });

  it('unreachable lists nodes no entry node can reach, in definition order', () => {
    expect(unreachable(welcome)).toEqual([]);
    expect(unreachable(winBack)).toEqual(['legacy_sms']);
    const noEntry = journey({
      nodes: [
        { id: 'x', type: 'send', label: 'X', config: { templateId: 't1' } },
        { id: 'y', type: 'exit', label: 'Y' },
      ],
      edges: [{ from: 'x', to: 'y' }],
    });
    expect(unreachable(noEntry)).toEqual(['x', 'y']);
  });
});

describe('graph — validateJourney', () => {
  it('j1 is publishable; j2 reports CYCLE, UNREACHABLE, then the per-node DEAD_END on the orphan', () => {
    expect(validateJourney(welcome)).toEqual([]);
    const issues = validateJourney(winBack);
    expect(issues.map((i) => i.code)).toEqual([
      'CYCLE',
      'UNREACHABLE',
      'DEAD_END',
    ]);
    expect(new Set(issues[0].nodeIds)).toEqual(
      new Set(['offer', 'wait', 'bought']),
    );
    expect(issues[1].nodeIds).toEqual(['legacy_sms']);
    expect(issues[2].nodeIds).toEqual(['legacy_sms']); // the orphan send node has no outgoing edge either
    expect(
      issues.every(
        (i) => typeof i.message === 'string' && i.message.length > 0,
      ),
    ).toBe(true);
  });

  it('reports structural problems in the documented order, then per-node problems in node order', () => {
    const messy = journey({
      nodes: [
        { id: 'start', type: 'entry', label: 'Start' },
        { id: 'start', type: 'entry', label: 'Start again' }, // DUPLICATE_ID + MULTIPLE_ENTRY
        { id: 'pick', type: 'branch', label: 'Pick' }, // OUT_DEGREE: one unlabelled edge
        { id: 'mail', type: 'send', label: 'Mail' }, // MISSING_CONFIG (no templateId) + DEAD_END
        { id: 'pause', type: 'wait', label: 'Pause', config: { hours: 0 } }, // MISSING_CONFIG + OUT_DEGREE (two edges)
        { id: 'end', type: 'exit', label: 'End' }, // BAD_TERMINAL: exit with an outgoing edge
      ],
      edges: [
        { from: 'start', to: 'pick' },
        { from: 'pick', to: 'pause' },
        { from: 'pause', to: 'mail' },
        { from: 'pause', to: 'end' },
        { from: 'end', to: 'start' }, // also makes the entry have an incoming edge (BAD_TERMINAL)
        { from: 'pause', to: 'nowhere' }, // DANGLING_EDGE
      ],
    });
    const issues = validateJourney(messy);
    const codes = issues.map((i) => i.code);

    // structural, in order
    expect(codes.slice(0, 4)).toEqual([
      'DUPLICATE_ID',
      'MULTIPLE_ENTRY',
      'DANGLING_EDGE',
      'CYCLE',
    ]);
    expect(issues[0].nodeIds).toEqual(['start']);
    expect(issues[2].nodeIds).toEqual(['pause']);
    expect(codes).not.toContain('UNREACHABLE');
    expect(codes).not.toContain('NO_ENTRY');

    // per node, in node order
    const perNode = issues
      .slice(4)
      .map((i) => `${i.code}:${i.nodeIds.join(',')}`);
    expect(perNode).toEqual([
      'BAD_TERMINAL:start',
      'OUT_DEGREE:pick',
      'DEAD_END:mail',
      'MISSING_CONFIG:mail',
      'OUT_DEGREE:pause',
      'MISSING_CONFIG:pause',
      'BAD_TERMINAL:end',
    ]);

    expect(
      validateJourney(
        journey({
          nodes: [{ id: 'only', type: 'exit', label: 'Only' }],
          edges: [],
        }),
      ).map((i) => i.code),
    ).toEqual(['NO_ENTRY', 'UNREACHABLE']);
  });
});

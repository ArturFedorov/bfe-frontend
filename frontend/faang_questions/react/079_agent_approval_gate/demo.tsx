import { useEffect, useRef, useState } from 'react';
import { ApprovalDecision, ApprovalGate, ApprovalRequest } from './approval_gate';

/**
 * Demo harness for ApprovalGate — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is approval_gate.test.tsx.
 */

const REQUEST_TTL_MS = 20_000;
const AGENT_THINK_MS = 1_000;
const DECIDE_LATENCY_MS = 1_200;

interface Proposal {
  action: string;
  current: string;
  proposed: string;
}

const PROPOSALS: Proposal[] = [
  {
    action: 'Relabel 340 items from car to vehicle',
    current: [
      'label: car            (340 items)',
      'label: truck          (12 items)',
      'label: bicycle        (88 items)',
      'confidence_floor: 0.50',
      'reviewer: auto',
    ].join('\n'),
    proposed: [
      'label: vehicle        (352 items)',
      'label: bicycle        (88 items)',
      'confidence_floor: 0.60',
      'reviewer: auto',
      'merge: car + truck -> vehicle',
    ].join('\n'),
  },
  {
    action: 'Delete 12 duplicate bounding boxes',
    current: [
      'img_1042.png: 3 boxes (1 duplicate)',
      'img_1077.png: 5 boxes (2 duplicates)',
      'img_1103.png: 2 boxes',
      'img_1190.png: 9 boxes (9 duplicates)',
      'total_boxes: 1,204',
    ].join('\n'),
    proposed: [
      'img_1042.png: 2 boxes',
      'img_1077.png: 3 boxes',
      'img_1103.png: 2 boxes',
      'img_1190.png: 0 boxes',
      'total_boxes: 1,192',
    ].join('\n'),
  },
];

interface DecisionRecord {
  key: number;
  requestId: string;
  summary: string;
  outcome: 'pending' | 'sent' | 'rejected';
}

type RunPhase = 'idle' | 'thinking' | 'awaiting_approval' | 'resumed';

function describe(decision: ApprovalDecision): string {
  if (decision.kind === 'approve_edited') {
    const lines = decision.proposed.split('\n').length;
    return `approve_edited (${lines} lines)`;
  }
  return decision.kind;
}

export default function Demo() {
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [gateKey, setGateKey] = useState(0);

  const requestCount = useRef(0);
  const decisionCount = useRef(0);
  const recordKey = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  // Every timer the fake backend schedules goes through here so unmount can clear it.
  const later = (ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => clearTimeout(id));
      pending.clear();
    };
  }, []);

  const buildRequest = (): ApprovalRequest => {
    requestCount.current += 1;
    const proposal = PROPOSALS[(requestCount.current - 1) % PROPOSALS.length];
    return {
      id: `req-${requestCount.current}`,
      action: proposal.action,
      current: proposal.current,
      proposed: proposal.proposed,
      expiresAt: Date.now() + REQUEST_TTL_MS,
    };
  };

  const startRun = () => {
    setPhase('thinking');
    setRequest(null);
    later(AGENT_THINK_MS, () => {
      setRequest(buildRequest());
      setPhase('awaiting_approval');
    });
  };

  // Reconnect replay: the stream re-sends the same requires_approval event, so
  // the component receives a *new object* with the same id and payload.
  const replay = () => {
    setRequest((prev) => (prev ? { ...prev } : prev));
  };

  const newRequest = () => {
    setRequest(buildRequest());
    setPhase('awaiting_approval');
  };

  const reset = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current.clear();
    setPhase('idle');
    setRequest(null);
    setDecisions([]);
    requestCount.current = 0;
    decisionCount.current = 0;
    setGateKey((k) => k + 1);
  };

  // Fake decision channel: resolves after 1.2s; every third call times out.
  const onDecide = (decision: ApprovalDecision): Promise<void> => {
    decisionCount.current += 1;
    const shouldFail = decisionCount.current % 3 === 0;
    recordKey.current += 1;
    const key = recordKey.current;

    setDecisions((prev) => [
      ...prev,
      { key, requestId: decision.requestId, summary: describe(decision), outcome: 'pending' },
    ]);

    return new Promise<void>((resolve, reject) => {
      later(DECIDE_LATENCY_MS, () => {
        setDecisions((prev) =>
          prev.map((d) => (d.key === key ? { ...d, outcome: shouldFail ? 'rejected' : 'sent' } : d)),
        );
        if (shouldFail) {
          reject(new Error('Decision channel timed out'));
          return;
        }
        setPhase('resumed');
        resolve();
      });
    });
  };

  const phaseLabel: Record<RunPhase, string> = {
    idle: 'Run idle',
    thinking: 'Agent running… a requires_approval event arrives in 1s',
    awaiting_approval: 'Run paused — waiting for the analyst',
    resumed: 'Decision accepted — agent resumed',
  };

  return (
    <div className="demo">
      <h2>Agent Approval Gate</h2>
      <p className="demo-note">
        Implement <code>ApprovalGate</code> in <code>approval_gate.tsx</code> — a dialog with a
        line diff of current vs proposed, Approve / Reject / Edit, a countdown from{' '}
        <code>expiresAt</code>, exactly-once submission, and harmless reconnect replays. The fake
        agent produces an <code>ApprovalRequest</code> 1s after Start with a 20s deadline;{' '}
        <code>onDecide</code> resolves after 1.2s and every third decision rejects with
        &quot;Decision channel timed out&quot; to exercise the error path. Simulate reconnect
        replay re-passes a new object with the same id; New request switches to a different id.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={startRun} disabled={phase === 'thinking'}>
            Start run
          </button>
          <button onClick={replay} disabled={!request}>
            Simulate reconnect replay
          </button>
          <button onClick={newRequest}>New request</button>
          <button onClick={reset}>Reset</button>
        </div>

        <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
          {phaseLabel[phase]}
          {request && (
            <>
              {' '}
              · current request <code>{request.id}</code>
            </>
          )}
        </p>

        <ApprovalGate key={gateKey} request={request} onDecide={onDecide} />

        <section style={{ marginTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
            Decisions received by the fake backend
          </h3>
          {decisions.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>None yet.</p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
              {decisions.map((d) => (
                <li key={d.key}>
                  <code>{d.requestId}</code> → {d.summary}{' '}
                  <strong
                    style={{
                      color:
                        d.outcome === 'sent' ? '#15803d' : d.outcome === 'rejected' ? '#b91c1c' : '#6b7280',
                    }}
                  >
                    {d.outcome === 'rejected' ? 'rejected: Decision channel timed out' : d.outcome}
                  </strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

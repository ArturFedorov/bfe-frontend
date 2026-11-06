/**
 * Reference solution for 079 — keep approval_gate.tsx blank for redo
 * practice; this file is for comparison after your own attempt.
 */
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';

export interface ApprovalRequest {
  id: string;
  action: string;
  proposed: string;
  current: string;
  expiresAt: number;
}

export type ApprovalDecision =
  | { requestId: string; kind: 'approve' | 'reject' }
  | { requestId: string; kind: 'approve_edited'; proposed: string };

export type DiffChange = 'added' | 'removed' | 'same';

export interface DiffLine {
  text: string;
  change: DiffChange;
}

export interface ApprovalGateProps {
  request: ApprovalRequest | null;
  onDecide: (decision: ApprovalDecision) => Promise<void>;
}

/** Set-membership diff: current lines in order, then lines only in proposed. */
export function computeDiff(current: string, proposed: string): DiffLine[] {
  const before = current.split('\n');
  const after = proposed.split('\n');
  const afterSet = new Set(after);
  const beforeSet = new Set(before);
  return [
    ...before.map<DiffLine>((text) => ({ text, change: afterSet.has(text) ? 'same' : 'removed' })),
    ...after.filter((text) => !beforeSet.has(text)).map<DiffLine>((text) => ({ text, change: 'added' })),
  ];
}

/**
 * The outer component only picks the identity: a different request id mounts
 * a fresh Gate (full reset), the same id keeps the existing one (pending/sent
 * state survives a replayed event), null renders nothing.
 */
export function ApprovalGate({ request, onDecide }: ApprovalGateProps): ReactElement | null {
  if (!request) return null;
  return <Gate key={request.id} request={request} onDecide={onDecide} />;
}

type Phase = 'idle' | 'pending' | 'sent';

function Gate({ request, onDecide }: { request: ApprovalRequest; onDecide: ApprovalGateProps['onDecide'] }): ReactElement {
  const titleId = useId();
  const editorId = useId();

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(request.proposed);
  const [now, setNow] = useState(() => Date.now());

  // Synchronous guard: state lags a tick, a ref does not. Double-clicks hit this.
  const inFlightRef = useRef(false);
  // Unmount (or a different-id remount) must make a late settlement a no-op.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.ceil((request.expiresAt - now) / 1000));
  // Expiry only matters while a decision has not been started: a decision in
  // flight across the deadline is the server's to accept or refuse.
  const expired = remaining === 0 && phase === 'idle';
  const locked = phase !== 'idle' || expired;

  const decide = (decision: ApprovalDecision) => {
    if (inFlightRef.current || locked) return;
    inFlightRef.current = true;
    setPhase('pending');
    setError(null);
    onDecide(decision).then(
      () => {
        if (aliveRef.current) setPhase('sent');
      },
      (err: unknown) => {
        inFlightRef.current = false;
        if (!aliveRef.current) return;
        setPhase('idle');
        setError(err instanceof Error ? err.message : String(err));
      },
    );
  };

  const approve = () =>
    decide(
      editing
        ? { requestId: request.id, kind: 'approve_edited', proposed: draft }
        : { requestId: request.id, kind: 'approve' },
    );
  const reject = () => decide({ requestId: request.id, kind: 'reject' });

  return (
    <div role="dialog" aria-labelledby={titleId} aria-busy={phase === 'pending' || undefined}>
      <h2 id={titleId}>Approval required</h2>
      <p>{request.action}</p>

      <ul aria-label="Diff">
        {computeDiff(request.current, request.proposed).map((line, i) => (
          <li key={i} data-change={line.change}>
            {line.text}
          </li>
        ))}
      </ul>

      {editing && (
        <div>
          <label htmlFor={editorId}>Proposed action</label>
          <textarea id={editorId} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={locked} />
        </div>
      )}

      <div>
        <button type="button" onClick={approve} disabled={locked}>
          Approve
        </button>
        <button type="button" onClick={reject} disabled={locked}>
          Reject
        </button>
        <button type="button" onClick={() => setEditing(true)} disabled={locked}>
          Edit
        </button>
      </div>

      <div role="status">
        {phase === 'sent' ? 'Decision sent' : phase === 'pending' ? 'Sending…' : expired ? '' : `Expires in ${remaining}s`}
      </div>
      {expired && <div role="alert">Expired</div>}
      {error !== null && <div role="alert">{error}</div>}
    </div>
  );
}

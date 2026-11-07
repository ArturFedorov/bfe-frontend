import {ReactElement, useEffect, useId, useRef, useState} from 'react';

export interface ApprovalRequest {
  id: string;
  /** Human-readable summary of what the agent wants to do. */
  action: string;
  /** Multi-line proposed action. */
  proposed: string;
  /** Multi-line current state the action would replace. */
  current: string;
  /** Epoch milliseconds after which the server auto-rejects. */
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

export function computeDiff(current: string, proposed: string): DiffLine[] {
  const before = current.split('\n');
  const after = proposed.split('\n');
  const afterSet = new Set(after);
  const beforeSet = new Set(before);

  return [
    ...before.map<DiffLine>((text) => ( { text, change: afterSet.has(text) ? 'same' : 'removed'})),
    ...after.filter((text) => !beforeSet.has(text)).map<DiffLine>((text) => ({ text, change: 'added' })),
  ]
}

export function ApprovalGate({ request, onDecide }: ApprovalGateProps): ReactElement | null {
  if(!request) return null;
  return <Gate key={request.id} request={request} onDecide={onDecide} />;
}

type Phase = 'idle' | 'pending' | 'sent';

function Gate({ request, onDecide } : { request: ApprovalRequest, onDecide: ApprovalGateProps['onDecide']}): ReactElement {
  const titleId = useId();
  const editorId = useId();

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(request.proposed);
  const [now, setNow] = useState(() => Date.now());

  const inFlightRef = useRef(false);
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.ceil((request.expiresAt - now) / 1000));
  const expired = remaining === 0 && phase === 'idle';
  const locked = phase !== 'idle' || expired;

  const decide = (decision: ApprovalDecision) => {
    if(inFlightRef.current || locked) return;
    inFlightRef.current = true;
    setPhase('pending');
    setError(null);
    onDecide(decision).then(
      () => {
        if(aliveRef.current) setPhase('sent');
      },
      (err: unknown) => {
        inFlightRef.current = false;
        if(!aliveRef.current) return;
        setPhase('idle');
        setError(err instanceof Error ? err.message : String(err));
      }
    );
  }

  const approve = () => {
    decide(
      editing
        ? { requestId: request.id, kind: 'approve_edited', proposed: draft }
        : { requestId: request.id, kind: 'approve' },
    );
  };

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
        {phase === 'sent' ? 'Decision sent' : phase === 'pending' ? 'Sending...' : expired ? '' : `Expires in ${remaining}s`}
      </div>
      {expired && <div role="alert">Expired</div>}
      {error !== null && <div role="alert">{error}</div>}
    </div>
  )
}

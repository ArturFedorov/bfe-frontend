import { ReactElement } from 'react';

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

export function ApprovalGate(_props: ApprovalGateProps): ReactElement | null {
  throw new Error('Not implemented');
}

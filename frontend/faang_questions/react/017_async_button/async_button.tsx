import type { ReactNode } from 'react';

export interface AsyncButtonProps {
  label: string;
  pendingLabel?: string;
  errorMessage?: string;
  onSync: () => Promise<void>;
}

export function AsyncButton({
  label,
  pendingLabel = 'Syncing…',
  errorMessage = 'Sync failed. Try again.',
  onSync,
}: AsyncButtonProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}

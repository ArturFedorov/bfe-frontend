/**
 * Milestone 2c — the Campaigns list, built on `useQuery` / `useMutation`.
 * See README.md in this folder. Tests: CampaignsPage.test.tsx.
 *
 * Must be rendered inside `QueryClientProvider` and `SessionProvider`.
 */
import type { ReactNode } from 'react';
import { api as defaultApi, type Api } from '../../shell/api';

export interface CampaignsPageProps {
  /** Backend to read from. Default: the shared app instance. */
  api?: Api;
  /** Rows per page. Default 10. */
  pageSize?: number;
}

export function CampaignsPage({
  api = defaultApi,
  pageSize = 10,
}: CampaignsPageProps): ReactNode {
  void api;
  void pageSize;
  throw new Error('Not implemented');
}

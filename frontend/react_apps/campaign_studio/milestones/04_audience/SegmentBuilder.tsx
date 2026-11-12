/**
 * Milestone 4b — nested AND/OR rule editor with a live match count.
 * See README.md in this folder. Tests: SegmentBuilder.test.tsx.
 */
import type { ReactNode } from 'react';
import { api as defaultApi, type Api } from '../../shell/api';
import type { Group } from './rules';

export interface SegmentBuilderProps {
  /** Backend for `listCustomers()`. Default: the shared app instance. */
  api?: Api;
  /** Starting rule. Default: an empty `and` group. */
  initialRule?: Group;
  /** Called with the (unsimplified) rule after every edit. */
  onChange?: (rule: Group) => void;
  /** Clock for relative date conditions. Default `() => new Date()`. */
  now?: () => Date;
}

export function SegmentBuilder({
  api = defaultApi,
  initialRule,
  onChange,
  now,
}: SegmentBuilderProps): ReactNode {
  void api;
  void initialRule;
  void onChange;
  void now;
  throw new Error('Not implemented');
}

/**
 * Milestone 7c — outline-style journey editor with validation and a simulator.
 * See README.md in this folder. Tests: JourneyBuilder.test.tsx.
 */
import type { ReactNode } from 'react';
import { api as defaultApi, type Api } from '../../shell/api';
import type { Journey } from '../../shell/types';
import type { RunEvent } from './events';

export interface SimulationOptions {
  /** Customers to push through the journey. */
  customerIds: string[];
  /** Decides the branch for a customer at a branch node. Default: alternate yes/no by customer index. */
  decide?: (customerId: string, branchNodeId: string) => 'yes' | 'no';
  /** Base instant for event timestamps. Default `new Date(0)`. */
  startAt?: Date;
}

/**
 * Walks every customer from the entry node to an exit, emitting events in a
 * deterministic order (customer by customer, node by node). Returns `[]` when
 * the journey has validation issues. `wait` nodes advance the clock by
 * `config.hours`; `send` nodes emit `sent` with the node's templateId.
 */
export function simulate(
  journey: Journey,
  options: SimulationOptions,
): RunEvent[] {
  void journey;
  void options;
  throw new Error('Not implemented');
}

export interface JourneyBuilderProps {
  /** Backend for `getJourney()` / `saveJourney()`. Default: the shared app instance. */
  api?: Api;
  /** Default `j1`. */
  journeyId?: string;
}

export function JourneyBuilder({
  api = defaultApi,
  journeyId = 'j1',
}: JourneyBuilderProps): ReactNode {
  void api;
  void journeyId;
  throw new Error('Not implemented');
}

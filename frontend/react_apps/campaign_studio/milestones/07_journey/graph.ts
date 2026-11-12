/**
 * Milestone 7a — journey graph algorithms and validation.
 * See README.md in this folder. Tests: graph.test.ts.
 */
import type { Journey } from '../../shell/types';

/**
 * Kahn's algorithm. Among nodes that are ready at the same time, the one that
 * appears first in `journey.nodes` goes first (deterministic order). Returns
 * `null` when the graph has a cycle. Edges to unknown nodes are ignored.
 */
export function topoOrder(journey: Journey): string[] | null {
  void journey;
  throw new Error('Not implemented');
}

/**
 * One cycle as a list of node ids, starting and ending with the same id
 * (e.g. `['offer', 'wait', 'bought', 'offer']`), or `null` when acyclic.
 */
export function findCycle(journey: Journey): string[] | null {
  void journey;
  throw new Error('Not implemented');
}

/** Ids not reachable from any `entry` node, in `journey.nodes` order. */
export function unreachable(journey: Journey): string[] {
  void journey;
  throw new Error('Not implemented');
}

export type IssueCode =
  | 'DUPLICATE_ID'
  | 'NO_ENTRY'
  | 'MULTIPLE_ENTRY'
  | 'DANGLING_EDGE'
  | 'CYCLE'
  | 'UNREACHABLE'
  /** A non-exit node with no outgoing edge. */
  | 'DEAD_END'
  /** A `branch` node needs exactly two outgoing edges labelled `yes` and `no`; `send`/`wait`/`entry` need exactly one. */
  | 'OUT_DEGREE'
  /** An `exit` node must have no outgoing edge; an `entry` node must have no incoming edge. */
  | 'BAD_TERMINAL'
  /** A `send` node without `config.templateId`, or a `wait` node without a positive `config.hours`. */
  | 'MISSING_CONFIG';

export interface ValidationIssue {
  code: IssueCode;
  /** Nodes involved; for `DANGLING_EDGE` the known end of the edge. */
  nodeIds: string[];
  message: string;
}

/**
 * Every problem in the journey, in this order of codes: DUPLICATE_ID, NO_ENTRY,
 * MULTIPLE_ENTRY, DANGLING_EDGE, CYCLE, UNREACHABLE, then per-node issues
 * (DEAD_END, OUT_DEGREE, BAD_TERMINAL, MISSING_CONFIG) in `journey.nodes` order.
 * Empty array means the journey can be published.
 */
export function validateJourney(journey: Journey): ValidationIssue[] {
  void journey;
  throw new Error('Not implemented');
}

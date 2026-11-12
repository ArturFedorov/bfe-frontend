import type { JSX } from 'react';

export type StepKind = 'trigger' | 'wait' | 'message' | 'branch' | 'exit';

export type Step = {
  id: string;
  kind: StepKind;
  label: string;
  /** Kind-specific settings; a branch uses `{ field: string; equals?: unknown }` (see `decideByConfig`). */
  config: Record<string, unknown>;
};

/** Directed edge. Branch steps have one `yes` and one `no` edge; every other step has at most one plain edge. */
export type Edge = { from: string; to: string; when?: 'yes' | 'no' };

export type Journey = { steps: Step[]; edges: Edge[] };

export type ProblemCode =
  | 'no_trigger'
  | 'multiple_triggers'
  | 'cycle'
  | 'unreachable'
  | 'dangling_branch'
  | 'missing_exit';

export type Problem = { code: ProblemCode; stepIds: string[]; message: string };

/** Decides which edge a branch takes for a customer. */
export type Decide = (branch: Step, customer: Record<string, unknown>) => boolean;

/** Kinds offered by "Add step after" (a journey has exactly one trigger, created elsewhere). */
export const ADDABLE_KINDS: Exclude<StepKind, 'trigger'>[] = ['wait', 'message', 'branch', 'exit'];

/** Hard stop for `simulate` so a cyclic journey terminates. */
export const SIMULATION_LIMIT = 1000;

export interface JourneyBuilderProps {
  value: Journey;
  onChange: (next: Journey) => void;
  /** Id factory for new steps — injected so tests are deterministic. */
  newId?: () => string;
  /** Branch decision used by Simulate; defaults to `decideByConfig`. */
  decide?: Decide;
}

/** Structural validation: triggers, cycles (DFS colours), reachability (BFS), branch edges, dead ends. */
export function validateJourney(journey: Journey): Problem[] {
  throw new Error('Not implemented');
}

/** Default branch rule: `customer[config.field] === config.equals`, or truthiness when `equals` is absent. */
export function decideByConfig(branch: Step, customer: Record<string, unknown>): boolean {
  throw new Error('Not implemented');
}

/** Visited step ids from the trigger to an exit / dead end, capped at `SIMULATION_LIMIT`. */
export function simulate(
  journey: Journey,
  customer: Record<string, unknown>,
  decide: Decide,
): string[] {
  throw new Error('Not implemented');
}

export function JourneyBuilder(props: JourneyBuilderProps): JSX.Element {
  throw new Error('Not implemented');
}

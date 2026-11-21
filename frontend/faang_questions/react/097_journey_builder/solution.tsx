import { useState } from 'react';
import type { ChangeEvent, JSX } from 'react';

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
export type Decide = (
  branch: Step,
  customer: Record<string, unknown>,
) => boolean;

/** Kinds offered by "Add step after" (a journey has exactly one trigger, created elsewhere). */
export const ADDABLE_KINDS: Exclude<StepKind, 'trigger'>[] = [
  'wait',
  'message',
  'branch',
  'exit',
];

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

// ---------------------------------------------------------------------------
// Pure graph helpers
// ---------------------------------------------------------------------------

type Color = 'white' | 'grey' | 'black';

/** Adjacency over existing steps only; edges touching a missing step are dropped. */
function buildAdjacency(journey: Journey): Map<string, string[]> {
  const adjacency = new Map<string, string[]>(
    journey.steps.map((s) => [s.id, []]),
  );
  for (const edge of journey.edges) {
    if (!adjacency.has(edge.to)) continue;
    adjacency.get(edge.from)?.push(edge.to);
  }
  return adjacency;
}

function findCycles(
  journey: Journey,
  adjacency: Map<string, string[]>,
): string[][] {
  const color = new Map<string, Color>(
    journey.steps.map((s) => [s.id, 'white']),
  );
  const path: string[] = [];
  const cycles: string[][] = [];

  const visit = (id: string) => {
    color.set(id, 'grey');
    path.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const c = color.get(next);
      if (c === 'grey') cycles.push(path.slice(path.indexOf(next)));
      else if (c === 'white') visit(next);
    }
    path.pop();
    color.set(id, 'black');
  };

  for (const step of journey.steps) {
    if (color.get(step.id) === 'white') visit(step.id);
  }
  return cycles;
}

function reachableFrom(
  start: string,
  adjacency: Map<string, string[]>,
): Set<string> {
  const seen = new Set([start]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const next of adjacency.get(queue[i]) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Structural validation: triggers, cycles (DFS colours), reachability (BFS), branch edges, dead ends. */
export function validateJourney(journey: Journey): Problem[] {
  const problems: Problem[] = [];
  const byId = new Map(journey.steps.map((s) => [s.id, s]));
  const labelOf = (id: string) => byId.get(id)?.label ?? id;
  const adjacency = buildAdjacency(journey);
  const validEdges = journey.edges.filter(
    (e) => byId.has(e.from) && byId.has(e.to),
  );

  const triggers = journey.steps.filter((s) => s.kind === 'trigger');
  if (triggers.length === 0) {
    problems.push({
      code: 'no_trigger',
      stepIds: [],
      message: 'Journey has no trigger',
    });
  } else if (triggers.length > 1) {
    problems.push({
      code: 'multiple_triggers',
      stepIds: triggers.map((s) => s.id),
      message: `Journey has multiple triggers: ${triggers.map((s) => s.label).join(', ')}`,
    });
  }

  for (const cycle of findCycles(journey, adjacency)) {
    problems.push({
      code: 'cycle',
      stepIds: cycle,
      message: `Cycle: ${cycle.map(labelOf).join(' → ')}`,
    });
  }

  if (triggers.length > 0) {
    const reachable = reachableFrom(triggers[0].id, adjacency);
    const unreachable = journey.steps.filter((s) => !reachable.has(s.id));
    if (unreachable.length > 0) {
      problems.push({
        code: 'unreachable',
        stepIds: unreachable.map((s) => s.id),
        message: `Unreachable steps: ${unreachable.map((s) => s.label).join(', ')}`,
      });
    }
  }

  for (const branch of journey.steps.filter((s) => s.kind === 'branch')) {
    const out = validEdges.filter((e) => e.from === branch.id);
    const hasYes = out.some((e) => e.when === 'yes');
    const hasNo = out.some((e) => e.when === 'no');
    if (hasYes && hasNo) continue;
    const missing =
      !hasYes && !hasNo
        ? 'yes and no paths'
        : hasYes
          ? 'a no path'
          : 'a yes path';
    problems.push({
      code: 'dangling_branch',
      stepIds: [branch.id],
      message: `Branch "${branch.label}" is missing ${missing}`,
    });
  }

  const deadEnds = journey.steps.filter(
    (s) =>
      s.kind !== 'branch' &&
      s.kind !== 'exit' &&
      (adjacency.get(s.id) ?? []).length === 0,
  );
  if (deadEnds.length > 0) {
    problems.push({
      code: 'missing_exit',
      stepIds: deadEnds.map((s) => s.id),
      message: `Dead end without exit: ${deadEnds.map((s) => s.label).join(', ')}`,
    });
  }

  return problems;
}

/** Default branch rule: `customer[config.field] === config.equals`, or truthiness when `equals` is absent. */
export function decideByConfig(
  branch: Step,
  customer: Record<string, unknown>,
): boolean {
  const field = String(branch.config.field);
  return 'equals' in branch.config
    ? customer[field] === branch.config.equals
    : Boolean(customer[field]);
}

/** Visited step ids from the trigger to an exit / dead end, capped at `SIMULATION_LIMIT`. */
export function simulate(
  journey: Journey,
  customer: Record<string, unknown>,
  decide: Decide,
): string[] {
  const byId = new Map(journey.steps.map((s) => [s.id, s]));
  const visited: string[] = [];
  let current = journey.steps.find((s) => s.kind === 'trigger');

  while (current && visited.length < SIMULATION_LIMIT) {
    visited.push(current.id);
    if (current.kind === 'exit') break;
    const step: Step = current;
    const when =
      step.kind === 'branch'
        ? decide(step, customer)
          ? 'yes'
          : 'no'
        : undefined;
    const edge = journey.edges.find(
      (e) => e.from === step.id && e.when === when,
    );
    current = edge ? byId.get(edge.to) : undefined;
  }
  return visited;
}

// ---------------------------------------------------------------------------
// Pure edits
// ---------------------------------------------------------------------------

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function insertAfter(journey: Journey, after: Step, inserted: Step): Journey {
  const index = journey.steps.findIndex((s) => s.id === after.id);
  const steps = [
    ...journey.steps.slice(0, index + 1),
    inserted,
    ...journey.steps.slice(index + 1),
  ];
  if (after.kind === 'branch') return { steps, edges: journey.edges };

  const plain = journey.edges.find(
    (e) => e.from === after.id && e.when === undefined,
  );
  const edges = journey.edges.filter((e) => e !== plain);
  edges.push({ from: after.id, to: inserted.id });
  if (plain && inserted.kind !== 'exit')
    edges.push({ from: inserted.id, to: plain.to });
  return { steps, edges };
}

function removeStep(journey: Journey, id: string): Journey {
  return {
    steps: journey.steps.filter((s) => s.id !== id),
    edges: journey.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

function setBranchTarget(
  journey: Journey,
  branchId: string,
  when: 'yes' | 'no',
  to: string,
): Journey {
  const edges = journey.edges.filter(
    (e) => !(e.from === branchId && e.when === when),
  );
  if (to) edges.push({ from: branchId, to, when });
  return { ...journey, edges };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const defaultNewId = (): string => crypto.randomUUID();

type SimulationResult = { kind: 'path'; ids: string[] } | { kind: 'error' };

export function JourneyBuilder({
  value,
  onChange,
  newId = defaultNewId,
  decide = decideByConfig,
}: JourneyBuilderProps): JSX.Element {
  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [customerDraft, setCustomerDraft] = useState('{}');
  const [result, setResult] = useState<SimulationResult>({
    kind: 'path',
    ids: [],
  });

  const problems = validateJourney(value);
  const byId = new Map(value.steps.map((s) => [s.id, s]));

  const handleAdd = (after: Step, event: ChangeEvent<HTMLSelectElement>) => {
    const kind = event.target.value as Exclude<StepKind, 'trigger'> | '';
    if (!kind) return;
    setAddingAfter(null);
    onChange(
      insertAfter(value, after, {
        id: newId(),
        kind,
        label: capitalise(kind),
        config: {},
      }),
    );
  };

  const handleSimulate = () => {
    let customer: unknown;
    try {
      customer = JSON.parse(customerDraft);
    } catch {
      setResult({ kind: 'error' });
      return;
    }
    if (
      typeof customer !== 'object' ||
      customer === null ||
      Array.isArray(customer)
    ) {
      setResult({ kind: 'error' });
      return;
    }
    setResult({
      kind: 'path',
      ids: simulate(value, customer as Record<string, unknown>, decide),
    });
  };

  const targetOf = (branchId: string, when: 'yes' | 'no') =>
    value.edges.find((e) => e.from === branchId && e.when === when)?.to ?? '';

  const pathIds = result.kind === 'path' ? result.ids : [];

  return (
    <div className="journey-builder">
      <ul role="tree" aria-label="Journey steps">
        {value.steps.map((step) => (
          <li
            key={step.id}
            role="treeitem"
            aria-label={`${step.label} (${step.kind})`}
            aria-selected={false}
          >
            <span>{step.label}</span> <span>({step.kind})</span>
            {step.kind !== 'exit' && (
              <button type="button" onClick={() => setAddingAfter(step.id)}>
                Add step after
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange(removeStep(value, step.id))}
            >
              Delete
            </button>
            {addingAfter === step.id && (
              <select
                aria-label="New step kind"
                value=""
                onChange={(event) => handleAdd(step, event)}
              >
                <option value="" />
                {ADDABLE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            )}
            {step.kind === 'branch' &&
              (['yes', 'no'] as const).map((when) => (
                <select
                  key={when}
                  aria-label={when === 'yes' ? 'Yes →' : 'No →'}
                  value={targetOf(step.id, when)}
                  onChange={(event) =>
                    onChange(
                      setBranchTarget(value, step.id, when, event.target.value),
                    )
                  }
                >
                  <option value="" />
                  {value.steps
                    .filter((other) => other.id !== step.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.label}
                      </option>
                    ))}
                </select>
              ))}
          </li>
        ))}
      </ul>

      {problems.length > 0 && (
        <ul role="alert">
          {problems.map((problem, i) => (
            <li key={`${problem.code}-${i}`}>{problem.message}</li>
          ))}
        </ul>
      )}

      <label>
        Customer JSON
        <textarea
          value={customerDraft}
          onChange={(event) => setCustomerDraft(event.target.value)}
        />
      </label>
      <button type="button" onClick={handleSimulate}>
        Simulate
      </button>
      {result.kind === 'error' && (
        <p role="status" aria-live="polite">
          Invalid customer JSON
        </p>
      )}
      <ol role="list" aria-label="Path">
        {pathIds.map((id, i) => (
          <li key={`${id}-${i}`}>{byId.get(id)?.label ?? id}</li>
        ))}
      </ol>
    </div>
  );
}

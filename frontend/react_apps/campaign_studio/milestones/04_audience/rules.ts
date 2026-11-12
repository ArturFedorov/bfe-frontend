/**
 * Milestone 4a — audience rules: a nested AND/OR tree evaluated against
 * customers, plus sorted-id set algebra for combining segments.
 * See README.md in this folder. Tests: rules.test.ts.
 */
import type { Customer } from '../../shell/types';

export type RuleField = 'plan' | 'country' | 'age' | 'tags' | 'lastPurchaseAt';

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  /** value is an array; true when the field equals any element. */
  | 'in'
  /** `tags` only: the array contains `value`. */
  | 'contains'
  /** `lastPurchaseAt` only: `value` is either an ISO date or a number of days (relative to `ctx.now`). */
  | 'before'
  | 'after'
  | 'isNull'
  | 'isNotNull';

export interface Condition {
  kind: 'condition';
  field: RuleField;
  op: Operator;
  value?: unknown;
}

export interface Group {
  kind: 'group';
  op: 'and' | 'or';
  /** Negates the group's result. */
  not?: boolean;
  children: Rule[];
}

export type Rule = Condition | Group;

export interface EvaluateContext {
  /** "Now" for relative date comparisons. Default `new Date()`. */
  now: Date;
}

export function condition(
  field: RuleField,
  op: Operator,
  value?: unknown,
): Condition {
  void field;
  void op;
  void value;
  throw new Error('Not implemented');
}

export function group(op: 'and' | 'or', children: Rule[], not = false): Group {
  void op;
  void children;
  void not;
  throw new Error('Not implemented');
}

/**
 * True when the customer satisfies the rule.
 *  - an empty `and` group is true, an empty `or` group is false;
 *  - comparisons against a missing / null field are false (except `isNull`);
 *  - `before` / `after` with a number N mean "more / fewer than N days before `ctx.now`";
 *  - `gt/gte/lt/lte` on `lastPurchaseAt` compare instants (ISO strings).
 */
export function evaluate(
  rule: Rule,
  customer: Customer,
  ctx?: EvaluateContext,
): boolean {
  void rule;
  void customer;
  void ctx;
  throw new Error('Not implemented');
}

/**
 * Returns a structurally simpler, logically equivalent rule:
 *  - nested groups with the same op (and no `not`) are flattened into the parent;
 *  - empty groups are removed from a parent (an empty root is returned as-is).
 *    An empty group means "nothing configured yet" in the editor; note this is
 *    the one rewrite that can change `evaluate` (an empty `and` inside an `or`);
 *  - a group with one child and no `not` is replaced by that child
 *    (except at the root, which stays a group);
 *  - duplicate conditions (same field/op/value) within a group are dropped.
 * Never mutates the input.
 */
export function simplify(rule: Rule): Rule {
  void rule;
  throw new Error('Not implemented');
}

export function countMatches(
  rule: Rule,
  customers: Customer[],
  ctx?: EvaluateContext,
): number {
  void rule;
  void customers;
  void ctx;
  throw new Error('Not implemented');
}

/** Ids of matching customers, sorted ascending (so they feed `intersect` & co). */
export function matchingIds(
  rule: Rule,
  customers: Customer[],
  ctx?: EvaluateContext,
): string[] {
  void rule;
  void customers;
  void ctx;
  throw new Error('Not implemented');
}

/** Inputs are sorted ascending, no duplicates. O(n + m), output sorted. */
export function intersect(
  a: readonly string[],
  b: readonly string[],
): string[] {
  void a;
  void b;
  throw new Error('Not implemented');
}

export function union(a: readonly string[], b: readonly string[]): string[] {
  void a;
  void b;
  throw new Error('Not implemented');
}

/** Elements of `a` not in `b`. */
export function difference(
  a: readonly string[],
  b: readonly string[],
): string[] {
  void a;
  void b;
  throw new Error('Not implemented');
}

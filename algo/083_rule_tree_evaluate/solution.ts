/**
 * 083. Rule Tree Evaluate — reference solution
 *
 * evaluate(node, record)
 *   Straight recursive interpretation of the tree. A Rule reads exactly one
 *   field from the record (important for the short-circuit test, which spies
 *   on property access) and dispatches on the operator with strict type
 *   guards so no operator/value combination can throw:
 *     - missing field (undefined) → false for every operator
 *     - eq: both sides primitive and `===`; neq: `!eq` for a present field
 *       (so neq against an array record value is true — matches the suite)
 *     - gt/lt: both sides must be numbers
 *     - contains: rule value must be a string; substring for string records,
 *       element membership for string[] records
 *     - in: string record value contained in the rule's string[] value
 *   Groups use `every` / `some`, which short-circuit natively and give the
 *   right identities for empty groups (AND[] → true, OR[] → false).
 *
 * simplify(node)
 *   Bottom-up normalisation with structural sharing. For a group, simplify
 *   each child first, then decide what to do with the *simplified* child:
 *     - empty group → drop it
 *     - group with the same op → splice its children up (flatten)
 *     - anything else → keep
 *   A `changed` flag records whether any child was replaced/dropped/flattened;
 *   if nothing changed we return the original group reference, otherwise a
 *   fresh group with the new children. Finally a group left with exactly one
 *   child collapses to that child. Rules are always returned as-is. The input
 *   is never mutated — we only ever build new arrays/objects for changed
 *   groups.
 *
 * Time: O(n) for both (each node visited once; flattening copies each child
 * reference at most once per level it moves). Space: O(depth) recursion plus
 * O(n) for the rebuilt parts of the tree.
 */

/** A leaf condition on one field of a contact record. */
export type Rule = {
  kind: 'rule';
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
  value: string | number | string[];
};

/** Combines children with AND / OR. Groups nest arbitrarily. */
export type Group = {
  kind: 'group';
  op: 'AND' | 'OR';
  children: Node[];
};

export type Node = Rule | Group;

/** One contact. A field that is absent is `undefined`. */
export type Record = {
  [field: string]: string | number | string[] | undefined;
};

type Primitive = string | number;

const isPrimitive = (v: unknown): v is Primitive =>
  typeof v === 'string' || typeof v === 'number';

function evaluateRule(rule: Rule, record: Record): boolean {
  const actual = record[rule.field];
  if (actual === undefined) return false;
  const expected = rule.value;

  switch (rule.operator) {
    case 'eq':
      return (
        isPrimitive(actual) && isPrimitive(expected) && actual === expected
      );
    case 'neq':
      return !(
        isPrimitive(actual) &&
        isPrimitive(expected) &&
        actual === expected
      );
    case 'gt':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual > expected
      );
    case 'lt':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        actual < expected
      );
    case 'contains':
      if (typeof expected !== 'string') return false;
      if (typeof actual === 'string') return actual.includes(expected);
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    case 'in':
      return (
        typeof actual === 'string' &&
        Array.isArray(expected) &&
        expected.includes(actual)
      );
    default:
      return false;
  }
}

/**
 * Does `record` satisfy the rule tree?
 * - missing field → false for every operator
 * - eq/neq: strict primitive comparison; neq is !eq for a present field
 * - gt/lt: both sides must be numbers, else false
 * - contains: substring for string values, element membership for string[]
 * - in: record string value ∈ rule's string[] value
 * - empty AND → true, empty OR → false
 */
export function evaluate(node: Node, record: Record): boolean {
  if (node.kind === 'rule') return evaluateRule(node, record);

  // `every` / `some` short-circuit and yield the empty-group identities.
  return node.op === 'AND'
    ? node.children.every((child) => evaluate(child, record))
    : node.children.some((child) => evaluate(child, record));
}

/**
 * Normalises a rule tree without mutating it: flattens same-op nested
 * groups, drops empty child groups, collapses single-child groups to the
 * child. Returns the SAME reference when nothing changes.
 */
export function simplify(node: Node): Node {
  if (node.kind === 'rule') return node;

  let changed = false;
  const out: Node[] = [];

  for (const child of node.children) {
    const simplified = simplify(child); // children first (bottom-up)
    if (simplified !== child) changed = true;

    if (simplified.kind === 'group') {
      if (simplified.children.length === 0) {
        changed = true; // drop builder leftovers
        continue;
      }
      if (simplified.op === node.op) {
        changed = true; // flatten same-op group into this one
        out.push(...simplified.children);
        continue;
      }
    }
    out.push(simplified);
  }

  if (out.length === 1) return out[0]; // collapse single-child group
  return changed ? { ...node, children: out } : node;
}

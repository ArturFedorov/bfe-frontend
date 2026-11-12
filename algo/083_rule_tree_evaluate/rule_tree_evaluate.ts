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
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Normalises a rule tree without mutating it: flattens same-op nested
 * groups, drops empty child groups, collapses single-child groups to the
 * child. Returns the SAME reference when nothing changes.
 */
export function simplify(node: Node): Node {
  // TODO: implement
  throw new Error('Not implemented');
}

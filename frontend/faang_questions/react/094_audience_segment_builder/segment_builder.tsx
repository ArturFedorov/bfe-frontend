import { ReactElement } from 'react';

export type Operator = 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';

export type RuleValue = string | number | string[];

export interface Rule {
  id: string;
  kind: 'rule';
  field: string;
  operator: Operator;
  value: RuleValue;
}

export type GroupOp = 'AND' | 'OR';

export interface Group {
  id: string;
  kind: 'group';
  op: GroupOp;
  children: SegmentNode[];
}

export type SegmentNode = Rule | Group;

export type FieldType = 'string' | 'number' | 'enum';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** Allowed values for `enum` fields. */
  options?: string[];
}

export type Customer = Record<string, string | number | string[]>;

export interface SegmentBuilderProps {
  /** The whole tree; the component never keeps its own copy. */
  value: Group;
  /** Called with a new root for every edit; untouched subtrees keep their identity. */
  onChange: (next: Group) => void;
  fields: FieldDef[];
  /** Sample customers evaluated live for the `N of M customers match` status. */
  customers: Customer[];
  /** Id generator for new rules/groups. Defaults to `crypto.randomUUID()`. */
  newId?: () => string;
}

/** Operators offered for a field type, in the order the `Operator` select lists them. The first is the default. */
export function operatorsForType(_type: FieldType): Operator[] {
  throw new Error('Not implemented');
}

/** True when `customer` satisfies the rule or group. A missing field never matches (not even `neq`). */
export function evaluate(_node: SegmentNode, _customer: Customer): boolean {
  throw new Error('Not implemented');
}

export function countMatches(_group: Group, _customers: Customer[]): number {
  throw new Error('Not implemented');
}

export function SegmentBuilder(_props: SegmentBuilderProps): ReactElement {
  throw new Error('Not implemented');
}

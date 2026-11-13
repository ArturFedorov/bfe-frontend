import type { ChangeEvent, ReactElement } from 'react';

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

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Operators offered for a field type, in the order the `Operator` select lists them. The first is the default. */
export function operatorsForType(type: FieldType): Operator[] {
  switch (type) {
    case 'number':
      return ['eq', 'neq', 'gt', 'lt'];
    case 'enum':
      return ['eq', 'neq', 'in'];
    case 'string':
      return ['eq', 'neq', 'contains', 'in'];
  }
}

/** `in` is the only operator whose value is a list; everything else is a scalar. */
const isListOperator = (operator: Operator): boolean => operator === 'in';

/**
 * The value a rule gets when its field or operator (list ↔ scalar) changes:
 * `[]` for a list operator, otherwise the type's neutral scalar.
 */
function defaultValueFor(field: FieldDef, operator: Operator): RuleValue {
  if (isListOperator(operator)) return [];
  switch (field.type) {
    case 'number':
      return 0;
    case 'enum':
      return field.options?.[0] ?? '';
    case 'string':
      return '';
  }
}

/** True when `customer` satisfies the rule or group. A missing field never matches (not even `neq`). */
export function evaluate(node: SegmentNode, customer: Customer): boolean {
  if (node.kind === 'group') {
    // `every` on [] is true and `some` on [] is false — exactly the spec for
    // empty AND / OR groups, so no special-casing is needed.
    return node.op === 'AND'
      ? node.children.every((child) => evaluate(child, customer))
      : node.children.some((child) => evaluate(child, customer));
  }

  const actual = customer[node.field];
  // A missing field is "unknown", and unknown satisfies nothing — including
  // `neq`, which would otherwise match every customer lacking the field.
  if (actual === undefined) return false;
  const expected = node.value;

  switch (node.operator) {
    case 'eq':
    case 'neq': {
      // Arrays never compare equal (reference semantics would be meaningless);
      // primitives use strict equality so `12` and `'12'` stay different.
      if (Array.isArray(actual) || Array.isArray(expected)) return false;
      return node.operator === 'eq' ? actual === expected : actual !== expected;
    }
    case 'gt':
    case 'lt': {
      if (typeof actual !== 'number' || typeof expected !== 'number') return false;
      return node.operator === 'gt' ? actual > expected : actual < expected;
    }
    case 'contains': {
      if (Array.isArray(expected)) return false;
      if (Array.isArray(actual)) return actual.some((item) => item === expected);
      if (typeof actual === 'string') {
        return actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      return false; // a number has no "substring"
    }
    case 'in': {
      // The rule value is a list; tolerate a scalar by treating it as one entry.
      const list = (Array.isArray(expected) ? expected : [expected]).map(String);
      if (list.length === 0) return false;
      if (Array.isArray(actual)) return actual.some((item) => list.includes(item));
      return list.includes(String(actual));
    }
  }
}

export function countMatches(group: Group, customers: Customer[]): number {
  return customers.reduce((count, customer) => count + (evaluate(group, customer) ? 1 : 0), 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const defaultNewId = (): string => crypto.randomUUID();

/**
 * Fully controlled: the tree lives in the parent. Every edit flows up as a new
 * root built by path-copying (each `GroupEditor` spreads only itself and
 * replaces the one child that changed), so siblings and untouched subtrees
 * keep their identity — cheap undo stacks and `React.memo` both rely on that.
 * The match count is derived on every render; there is no effect or timer.
 */
export function SegmentBuilder({
  value,
  onChange,
  fields,
  customers,
  newId = defaultNewId,
}: SegmentBuilderProps): ReactElement {
  const matches = countMatches(value, customers);

  return (
    <div className="segment-builder">
      <GroupEditor group={value} fields={fields} newId={newId} onChange={onChange} />
      <p role="status" aria-live="polite">
        {`${matches} of ${customers.length} customers match`}
      </p>
    </div>
  );
}

interface GroupEditorProps {
  group: Group;
  fields: FieldDef[];
  newId: () => string;
  /** Receives the replacement for *this* group; the parent splices it into its own copy. */
  onChange: (next: Group) => void;
  /** Absent for the root group, which cannot be removed. */
  onRemove?: () => void;
}

function GroupEditor({ group, fields, newId, onChange, onRemove }: GroupEditorProps): ReactElement {
  // Path copy: a new children array with exactly one slot swapped. Every
  // other element is the same object the parent handed us.
  const replaceChild = (index: number, next: SegmentNode) => {
    const children = group.children.slice();
    children[index] = next;
    onChange({ ...group, children });
  };

  const removeChild = (index: number) => {
    onChange({ ...group, children: group.children.filter((_, i) => i !== index) });
  };

  const toggleOp = () => onChange({ ...group, op: group.op === 'AND' ? 'OR' : 'AND' });

  const addRule = () => {
    const field = fields[0];
    const operator = operatorsForType(field.type)[0];
    const rule: Rule = {
      id: newId(),
      kind: 'rule',
      field: field.name,
      operator,
      value: defaultValueFor(field, operator),
    };
    onChange({ ...group, children: [...group.children, rule] });
  };

  const addGroup = () => {
    const child: Group = { id: newId(), kind: 'group', op: 'AND', children: [] };
    onChange({ ...group, children: [...group.children, child] });
  };

  return (
    <fieldset role="group" aria-label={`Group (${group.op})`} className="segment-group">
      {/* Toolbar precedes the children so the group's own controls come first in reading/tab order. */}
      <div className="segment-group__toolbar">
        {/* The visible label *is* the state ("Match all" ⇔ AND), so no aria-pressed is needed;
            a pressed state on a button whose label flips would read as contradictory. */}
        <button type="button" onClick={toggleOp}>
          {group.op === 'AND' ? 'Match all' : 'Match any'}
        </button>
        <button type="button" onClick={addRule}>
          Add rule
        </button>
        <button type="button" onClick={addGroup}>
          Add group
        </button>
        {onRemove && (
          <button type="button" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      {group.children.map((child, index) =>
        child.kind === 'group' ? (
          <GroupEditor
            key={child.id}
            group={child}
            fields={fields}
            newId={newId}
            onChange={(next) => replaceChild(index, next)}
            onRemove={() => removeChild(index)}
          />
        ) : (
          <RuleRow
            key={child.id}
            rule={child}
            fields={fields}
            onChange={(next) => replaceChild(index, next)}
            onRemove={() => removeChild(index)}
          />
        ),
      )}
    </fieldset>
  );
}

interface RuleRowProps {
  rule: Rule;
  fields: FieldDef[];
  onChange: (next: Rule) => void;
  onRemove: () => void;
}

function RuleRow({ rule, fields, onChange, onRemove }: RuleRowProps): ReactElement {
  // A saved rule may reference a field that no longer exists. Rather than
  // silently snapping it to `fields[0]` (which would misreport the rule), keep
  // it visible as an unknown string field so the user can re-point or remove it.
  const known = fields.find((f) => f.name === rule.field);
  const field: FieldDef = known ?? { name: rule.field, label: `${rule.field} (unknown)`, type: 'string' };
  const fieldOptions = known ? fields : [field, ...fields];

  const onFieldChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const name = event.target.value;
    // React fires onChange for a <select> even when the same option is re-picked.
    if (name === rule.field) return;
    const next = fields.find((f) => f.name === name);
    if (!next) return;
    const operator = operatorsForType(next.type)[0];
    onChange({ ...rule, field: name, operator, value: defaultValueFor(next, operator) });
  };

  const onOperatorChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const operator = event.target.value as Operator;
    if (operator === rule.operator) return;
    // The value only resets when its *shape* changes (list ↔ scalar); switching
    // `eq` → `neq` keeps what the user typed.
    const shapeChanged = isListOperator(operator) !== isListOperator(rule.operator);
    onChange({ ...rule, operator, value: shapeChanged ? defaultValueFor(field, operator) : rule.value });
  };

  return (
    <div className="segment-rule">
      <label>
        Field{' '}
        <select value={rule.field} onChange={onFieldChange}>
          {fieldOptions.map((f) => (
            <option key={f.name} value={f.name}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Operator{' '}
        <select value={rule.operator} onChange={onOperatorChange}>
          {operatorsForType(field.type).map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </label>
      <label>
        Value <ValueControl rule={rule} field={field} onChange={(value) => onChange({ ...rule, value })} />
      </label>
      <button type="button" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

interface ValueControlProps {
  rule: Rule;
  field: FieldDef;
  onChange: (value: RuleValue) => void;
}

/** Picks the native control for the (field type, operator) pair. */
function ValueControl({ rule, field, onChange }: ValueControlProps): ReactElement {
  const asList = Array.isArray(rule.value) ? rule.value : [];

  if (isListOperator(rule.operator)) {
    if (field.type === 'enum') {
      return (
        <select
          multiple
          value={asList}
          onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    // Free-text list: shown as "a, b", stored as ['a', 'b']. Empty entries are
    // kept while typing so a trailing comma survives the controlled round-trip.
    return (
      <input
        type="text"
        value={asList.join(', ')}
        onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()))}
      />
    );
  }

  const scalar = Array.isArray(rule.value) ? '' : rule.value;

  switch (field.type) {
    case 'number':
      // A blank input is stored as '' (not coerced to 0) so clearing the field
      // doesn't make "0" jump in under the user's cursor; `evaluate` treats a
      // non-number as "no match" for gt/lt and as unequal for eq.
      return (
        <input
          type="number"
          value={scalar}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    case 'enum':
      return (
        <select value={String(scalar)} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'string':
      return <input type="text" value={String(scalar)} onChange={(e) => onChange(e.target.value)} />;
  }
}

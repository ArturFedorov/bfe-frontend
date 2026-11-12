/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import {
  countMatches,
  Customer,
  evaluate,
  FieldDef,
  Group,
  operatorsForType,
  Rule,
  SegmentBuilder,
} from './segment_builder';

const FIELDS: FieldDef[] = [
  { name: 'country', label: 'Country', type: 'string' },
  { name: 'orders', label: 'Orders', type: 'number' },
  { name: 'plan', label: 'Plan', type: 'enum', options: ['free', 'pro', 'team'] },
  { name: 'tags', label: 'Tags', type: 'string' },
];

const CUSTOMERS: Customer[] = [
  { id: 'u1', country: 'Germany', orders: 12, plan: 'pro', tags: ['vip', 'newsletter'] },
  { id: 'u2', country: 'France', orders: 2, plan: 'free', tags: ['newsletter'] },
  { id: 'u3', country: 'Germany', orders: 0, plan: 'free', tags: [] },
  { id: 'u4', country: 'Spain', orders: 30, plan: 'team', tags: ['vip'] },
  { id: 'u5', country: 'Poland', plan: 'pro', tags: ['beta'] }, // no orders field
];

const rule = (id: string, field: string, operator: Rule['operator'], value: Rule['value']): Rule => ({
  id,
  kind: 'rule',
  field,
  operator,
  value,
});

const group = (id: string, op: Group['op'], children: Group['children']): Group => ({
  id,
  kind: 'group',
  op,
  children,
});

/** Controlled harness: keeps the tree in state and records every value handed to onChange. */
function Harness({ initial, onChange }: { initial: Group; onChange?: (next: Group) => void }) {
  const [value, setValue] = useState(initial);
  const counter = useRef(0);
  const newId = () => `new-${++counter.current}`;
  return (
    <SegmentBuilder
      value={value}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
      fields={FIELDS}
      customers={CUSTOMERS}
      newId={newId}
    />
  );
}

const status = () => screen.getByRole('status');
const groupNamed = (name: string) => screen.getByRole('group', { name });
const rows = () => screen.getAllByLabelText('Field');
const optionValues = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((o) => (o as HTMLOptionElement).value);

describe('evaluate (pure)', () => {
  it('eq / neq / gt / lt compare numbers and strings; a missing field never matches, not even with neq', () => {
    const u1 = CUSTOMERS[0];
    expect(evaluate(rule('r', 'country', 'eq', 'Germany'), u1)).toBe(true);
    expect(evaluate(rule('r', 'country', 'neq', 'Germany'), u1)).toBe(false);
    expect(evaluate(rule('r', 'orders', 'gt', 10), u1)).toBe(true);
    expect(evaluate(rule('r', 'orders', 'lt', 10), u1)).toBe(false);
    expect(evaluate(rule('r', 'orders', 'eq', 12), u1)).toBe(true);
    expect(evaluate(rule('r', 'orders', 'eq', '12'), u1)).toBe(false);

    const noOrders = CUSTOMERS[4];
    expect(evaluate(rule('r', 'orders', 'gt', 0), noOrders)).toBe(false);
    expect(evaluate(rule('r', 'orders', 'neq', 99), noOrders)).toBe(false);
    expect(evaluate(rule('r', 'missing', 'eq', 'x'), noOrders)).toBe(false);
  });

  it('contains works on strings (case-insensitive) and on array fields; in works on enum values and arrays', () => {
    const u1 = CUSTOMERS[0];
    expect(evaluate(rule('r', 'country', 'contains', 'man'), u1)).toBe(true);
    expect(evaluate(rule('r', 'country', 'contains', 'MAN'), u1)).toBe(true);
    expect(evaluate(rule('r', 'tags', 'contains', 'vip'), u1)).toBe(true);
    expect(evaluate(rule('r', 'tags', 'contains', 'beta'), u1)).toBe(false);

    expect(evaluate(rule('r', 'plan', 'in', ['pro', 'team']), u1)).toBe(true);
    expect(evaluate(rule('r', 'plan', 'in', ['free']), u1)).toBe(false);
    expect(evaluate(rule('r', 'tags', 'in', ['beta', 'newsletter']), u1)).toBe(true);
    expect(evaluate(rule('r', 'tags', 'in', []), u1)).toBe(false);
    expect(evaluate(rule('r', 'tags', 'in', ['vip']), CUSTOMERS[2])).toBe(false);
  });

  it('groups combine children with AND / OR recursively; an empty AND group matches everyone, an empty OR group no one', () => {
    const tree = group('root', 'AND', [
      rule('a', 'country', 'eq', 'Germany'),
      group('g', 'OR', [rule('b', 'orders', 'gt', 10), rule('c', 'plan', 'eq', 'free')]),
    ]);
    expect(evaluate(tree, CUSTOMERS[0])).toBe(true); // Germany, 12 orders
    expect(evaluate(tree, CUSTOMERS[2])).toBe(true); // Germany, free
    expect(evaluate(tree, CUSTOMERS[1])).toBe(false); // France
    expect(evaluate(tree, CUSTOMERS[3])).toBe(false); // Spain

    expect(evaluate(group('e', 'AND', []), CUSTOMERS[0])).toBe(true);
    expect(evaluate(group('e', 'OR', []), CUSTOMERS[0])).toBe(false);
  });
});

describe('countMatches (pure)', () => {
  it('counts the customers that satisfy the root group', () => {
    expect(countMatches(group('root', 'AND', []), CUSTOMERS)).toBe(5);
    expect(countMatches(group('root', 'AND', [rule('a', 'plan', 'in', ['pro'])]), CUSTOMERS)).toBe(2);
    expect(
      countMatches(group('root', 'OR', [rule('a', 'orders', 'gt', 20), rule('b', 'country', 'eq', 'France')]), CUSTOMERS),
    ).toBe(2);
  });
});

describe('operatorsForType (pure)', () => {
  it('offers comparison operators for numbers, membership for enums, text operators for strings; eq comes first', () => {
    expect(operatorsForType('number')).toEqual(['eq', 'neq', 'gt', 'lt']);
    expect(operatorsForType('enum')).toEqual(['eq', 'neq', 'in']);
    expect(operatorsForType('string')).toEqual(['eq', 'neq', 'contains', 'in']);
  });
});

describe('SegmentBuilder — rendering', () => {
  const initial = group('root', 'AND', [
    rule('r1', 'country', 'eq', 'Germany'),
    group('g1', 'OR', [rule('r2', 'orders', 'gt', 10), rule('r3', 'plan', 'eq', 'free')]),
  ]);

  it('renders groups as labelled role=group with their toggle, rule rows with labelled controls, and the live match count', () => {
    render(<Harness initial={initial} />);

    const root = groupNamed('Group (AND)');
    const nested = groupNamed('Group (OR)');
    expect(root).toContainElement(nested);
    expect(within(root).getAllByRole('button', { name: 'Match all' })).toHaveLength(1);
    expect(within(nested).getByRole('button', { name: 'Match any' })).toBeInTheDocument();

    expect(rows()).toHaveLength(3);
    expect(screen.getAllByLabelText('Operator')).toHaveLength(3);
    expect(screen.getAllByLabelText('Value')).toHaveLength(3);
    expect(rows()[0]).toHaveValue('country');
    expect(screen.getAllByLabelText('Operator')[1]).toHaveValue('gt');
    expect(screen.getAllByLabelText('Value')[1]).toHaveAttribute('type', 'number');
    expect(screen.getAllByLabelText('Value')[1]).toHaveValue(10);
    expect(screen.getAllByLabelText('Value')[2].tagName).toBe('SELECT');
    expect(screen.getAllByLabelText('Value')[2]).toHaveValue('free');

    expect(status()).toHaveTextContent('2 of 5 customers match');
  });

  it('the root group has no Remove button; nested groups and every rule do', () => {
    render(<Harness initial={initial} />);
    const root = groupNamed('Group (AND)');
    const nested = groupNamed('Group (OR)');
    // root toolbar comes first in DOM order: its buttons are Match all, Add rule, Add group — no Remove
    const rootToolbarButtons = within(root)
      .getAllByRole('button')
      .slice(0, 3)
      .map((b) => b.textContent);
    expect(rootToolbarButtons).toEqual(['Match all', 'Add rule', 'Add group']);
    expect(within(nested).getAllByRole('button', { name: 'Remove' })).toHaveLength(3); // group + 2 rules
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(4); // + rule r1
  });

  it('the operator select only offers the operators valid for the field type', () => {
    render(<Harness initial={initial} />);
    const [country, orders, plan] = screen.getAllByLabelText('Operator');
    expect(optionValues(country)).toEqual(['eq', 'neq', 'contains', 'in']);
    expect(optionValues(orders)).toEqual(['eq', 'neq', 'gt', 'lt']);
    expect(optionValues(plan)).toEqual(['eq', 'neq', 'in']);
  });
});

describe('SegmentBuilder — controlled editing', () => {
  const initial = group('root', 'AND', [
    rule('r1', 'country', 'eq', 'Germany'),
    group('g1', 'OR', [rule('r2', 'orders', 'gt', 10), rule('r3', 'plan', 'eq', 'free')]),
  ]);

  it('toggling Match all / Match any flips the group op through onChange and updates the label and count', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Harness initial={initial} onChange={onChange} />);
    expect(status()).toHaveTextContent('2 of 5 customers match');

    await user.click(within(groupNamed('Group (AND)')).getAllByRole('button', { name: 'Match all' })[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Group;
    expect(next.op).toBe('OR');
    expect(next.id).toBe('root');
    expect(screen.getAllByRole('group', { name: 'Group (OR)' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Match any' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Match all' })).not.toBeInTheDocument();
    // Germany OR (orders > 10 OR plan = free): u1, u2, u3, u4
    expect(status()).toHaveTextContent('4 of 5 customers match');
  });

  it('editing a value emits a new root but keeps untouched siblings and subtrees by identity (structural sharing)', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Harness initial={initial} onChange={onChange} />);

    const ordersValue = screen.getAllByLabelText('Value')[1];
    await user.clear(ordersValue);
    await user.type(ordersValue, '25');

    const next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect(next).not.toBe(initial);
    expect(next.children[0]).toBe(initial.children[0]); // r1 untouched
    const nestedBefore = initial.children[1] as Group;
    const nestedAfter = next.children[1] as Group;
    expect(nestedAfter).not.toBe(nestedBefore);
    expect(nestedAfter.children[1]).toBe(nestedBefore.children[1]); // r3 untouched
    expect(nestedAfter.children[0]).toEqual({ ...nestedBefore.children[0], value: 25 });
    // Germany AND (orders > 25 OR plan = free): only u3 now
    expect(status()).toHaveTextContent('1 of 5 customers match');

    // toggling the nested group keeps the root's other child by identity too
    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Match any' }));
    const afterToggle = onChange.mock.calls[0][0] as Group;
    expect(afterToggle.children[0]).toBe(initial.children[0]);
    expect((afterToggle.children[1] as Group).op).toBe('AND');
  });

  it('changing the field resets operator and value to defaults valid for the new type and swaps the value control', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Harness initial={initial} onChange={onChange} />);

    // country (string, eq Germany) → orders (number)
    await user.selectOptions(rows()[0], 'orders');
    let next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect(next.children[0]).toEqual({ id: 'r1', kind: 'rule', field: 'orders', operator: 'eq', value: 0 });
    expect(screen.getAllByLabelText('Operator')[0]).toHaveValue('eq');
    expect(optionValues(screen.getAllByLabelText('Operator')[0])).toEqual(['eq', 'neq', 'gt', 'lt']);
    expect(screen.getAllByLabelText('Value')[0]).toHaveAttribute('type', 'number');
    expect(screen.getAllByLabelText('Value')[0]).toHaveValue(0);

    // → plan (enum): select with the enum options, first option as default
    await user.selectOptions(rows()[0], 'plan');
    next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect(next.children[0]).toEqual({ id: 'r1', kind: 'rule', field: 'plan', operator: 'eq', value: 'free' });
    const planValue = screen.getAllByLabelText('Value')[0];
    expect(planValue.tagName).toBe('SELECT');
    expect(optionValues(planValue)).toEqual(['free', 'pro', 'team']);

    // operator `in` on an enum → multi-select; picking two values stores a string[]
    await user.selectOptions(screen.getAllByLabelText('Operator')[0], 'in');
    next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect((next.children[0] as Rule).value).toEqual([]);
    const multi = screen.getAllByLabelText('Value')[0] as HTMLSelectElement;
    expect(multi.multiple).toBe(true);
    await user.selectOptions(multi, ['pro', 'team']);
    next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect((next.children[0] as Rule).value).toEqual(['pro', 'team']);
    // plan in [pro, team] AND (orders > 10 OR plan = free): u1 and u4
    expect(status()).toHaveTextContent('2 of 5 customers match');
  });

  it('Add rule, Add group and Remove edit the right group and use newId for new nodes', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Harness initial={initial} onChange={onChange} />);

    await user.click(within(groupNamed('Group (OR)')).getByRole('button', { name: 'Add rule' }));
    let next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect((next.children[1] as Group).children).toHaveLength(3);
    expect((next.children[1] as Group).children[2]).toEqual({
      id: 'new-1',
      kind: 'rule',
      field: 'country',
      operator: 'eq',
      value: '',
    });
    expect(next.children[0]).toBe(initial.children[0]);
    expect(rows()).toHaveLength(4);

    await user.click(within(groupNamed('Group (AND)')).getAllByRole('button', { name: 'Add group' })[0]);
    next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect(next.children).toHaveLength(3);
    expect(next.children[2]).toEqual({ id: 'new-2', kind: 'group', op: 'AND', children: [] });
    expect(screen.getAllByRole('group', { name: 'Group (AND)' })).toHaveLength(2);

    // remove the nested OR group entirely
    const nested = groupNamed('Group (OR)');
    await user.click(within(nested).getAllByRole('button', { name: 'Remove' })[0]);
    next = onChange.mock.calls.at(-1)?.[0] as Group;
    expect(next.children.map((c) => c.id)).toEqual(['r1', 'new-2']);
    expect(screen.queryByRole('group', { name: 'Group (OR)' })).not.toBeInTheDocument();
    expect(rows()).toHaveLength(1);
    expect(status()).toHaveTextContent('2 of 5 customers match');

    // remove the last rule: an empty AND root matches everyone
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(screen.queryAllByLabelText('Field')).toHaveLength(0);
    expect(status()).toHaveTextContent('5 of 5 customers match');
  });

  it('does not call onChange when nothing changed and never mutates the value it was given', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    const snapshot = JSON.parse(JSON.stringify(initial)) as Group;
    render(<Harness initial={initial} onChange={onChange} />);

    await user.selectOptions(rows()[0], 'country'); // same field as before
    await user.click(screen.getAllByRole('button', { name: 'Match all' })[0]);
    expect(initial).toEqual(snapshot);
    const flips = onChange.mock.calls.filter((c) => (c[0] as Group).op === 'OR');
    expect(flips).toHaveLength(1);
  });
});

describe('SegmentBuilder — keyboard and a11y', () => {
  it('every control is a native labelled element reachable with Tab in reading order', async () => {
    const user = userEvent.setup();
    render(<Harness initial={group('root', 'AND', [rule('r1', 'orders', 'gt', 10)])} />);

    const names: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      await user.tab();
      const el = document.activeElement as HTMLElement;
      const label = el.closest('label');
      // a form control is named by its <label>'s own text; a button by its content
      names.push((label ? label.childNodes[0].textContent : el.textContent)?.trim() ?? '');
    }
    expect(names).toEqual(['Match all', 'Add rule', 'Add group', 'Field', 'Operator', 'Value', 'Remove']);
    expect(document.activeElement?.tagName).toBe('BUTTON');
  });
});

/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi } from '../../shell/api';
import { customers } from '../../shell/fixtures';
import { SegmentBuilder } from './SegmentBuilder';
import type { Group } from './rules';

const NOW = new Date('2026-03-01T12:00:00.000Z');

function setup(
  props: Partial<React.ComponentProps<typeof SegmentBuilder>> = {},
) {
  const api = createApi({ latencyMs: 0 });
  const onChange = jest.fn();
  const utils = render(
    <SegmentBuilder api={api} onChange={onChange} now={() => NOW} {...props} />,
  );
  return { api, onChange, ...utils };
}

describe('04 SegmentBuilder', () => {
  it('renders an empty root AND group, its controls, and "all customers match" once loaded', async () => {
    const { api } = setup();
    await screen.findByText(
      `${customers.length} of ${customers.length} customers match`,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      `${customers.length} of ${customers.length} customers match`,
    );
    expect(api.calls.listCustomers).toBe(1);

    const operator = screen.getByRole('combobox', { name: 'Group operator' });
    expect(operator).toHaveValue('and');
    expect(
      screen.getByRole('button', { name: 'Add condition' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add group' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Field' }),
    ).not.toBeInTheDocument();
  });

  it('adding and editing a condition updates the live count and reports the rule via onChange', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await screen.findByText(
      `${customers.length} of ${customers.length} customers match`,
    );

    await user.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(screen.getByRole('combobox', { name: 'Field' })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Operator' }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Field' }),
      'plan',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Operator' }),
      'eq',
    );
    const value = screen.getByRole('textbox', { name: 'Value' });
    await user.clear(value);
    await user.type(value, 'pro');

    const expected = customers.filter((c) => c.plan === 'pro').length;
    expect(screen.getByRole('status')).toHaveTextContent(
      `${expected} of ${customers.length} customers match`,
    );

    const last = onChange.mock.calls.at(-1)?.[0] as Group;
    expect(last).toMatchObject({
      kind: 'group',
      op: 'and',
      children: [{ kind: 'condition', field: 'plan', op: 'eq', value: 'pro' }],
    });

    // numeric fields are parsed as numbers
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Field' }),
      'age',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Operator' }),
      'gte',
    );
    await user.clear(screen.getByRole('textbox', { name: 'Value' }));
    await user.type(screen.getByRole('textbox', { name: 'Value' }), '40');
    const expectedAge = customers.filter((c) => c.age >= 40).length;
    expect(screen.getByRole('status')).toHaveTextContent(
      `${expectedAge} of ${customers.length} customers match`,
    );
    expect(
      (onChange.mock.calls.at(-1)?.[0] as Group).children[0],
    ).toMatchObject({ field: 'age', op: 'gte', value: 40 });
  });

  it('switching the root operator to OR and removing a condition re-counts', async () => {
    const user = userEvent.setup();
    const initialRule: Group = {
      kind: 'group',
      op: 'and',
      children: [
        { kind: 'condition', field: 'plan', op: 'eq', value: 'free' },
        { kind: 'condition', field: 'country', op: 'eq', value: 'US' },
      ],
    };
    setup({ initialRule });
    const both = customers.filter(
      (c) => c.plan === 'free' && c.country === 'US',
    ).length;
    await screen.findByText(`${both} of ${customers.length} customers match`);
    expect(screen.getByRole('status')).toHaveTextContent(
      `${both} of ${customers.length} customers match`,
    );
    expect(screen.getAllByRole('combobox', { name: 'Field' })).toHaveLength(2);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Group operator' }),
      'or',
    );
    const either = customers.filter(
      (c) => c.plan === 'free' || c.country === 'US',
    ).length;
    expect(screen.getByRole('status')).toHaveTextContent(
      `${either} of ${customers.length} customers match`,
    );

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(screen.getAllByRole('combobox', { name: 'Field' })).toHaveLength(1);
    const usOnly = customers.filter((c) => c.country === 'US').length;
    expect(screen.getByRole('status')).toHaveTextContent(
      `${usOnly} of ${customers.length} customers match`,
    );
  });

  it('nested groups get their own operator toggle and controls; isNull hides the value input', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await screen.findByText(
      `${customers.length} of ${customers.length} customers match`,
    );

    await user.click(screen.getByRole('button', { name: 'Add group' }));
    const operators = screen.getAllByRole('combobox', {
      name: 'Group operator',
    });
    expect(operators).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Add condition' }),
    ).toHaveLength(2);

    const nested = screen.getAllByRole('group')[1];
    await user.selectOptions(
      within(nested).getByRole('combobox', { name: 'Group operator' }),
      'or',
    );
    await user.click(
      within(nested).getByRole('button', { name: 'Add condition' }),
    );
    await user.selectOptions(
      within(nested).getByRole('combobox', { name: 'Field' }),
      'lastPurchaseAt',
    );
    await user.selectOptions(
      within(nested).getByRole('combobox', { name: 'Operator' }),
      'isNull',
    );
    expect(
      within(nested).queryByRole('textbox', { name: 'Value' }),
    ).not.toBeInTheDocument();

    const expected = customers.filter((c) => c.lastPurchaseAt === null).length;
    expect(screen.getByRole('status')).toHaveTextContent(
      `${expected} of ${customers.length} customers match`,
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      kind: 'group',
      op: 'and',
      children: [
        {
          kind: 'group',
          op: 'or',
          children: [
            { kind: 'condition', field: 'lastPurchaseAt', op: 'isNull' },
          ],
        },
      ],
    });

    await user.click(
      within(nested).getByRole('button', { name: 'Remove group' }),
    );
    expect(
      screen.getAllByRole('combobox', { name: 'Group operator' }),
    ).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      `${customers.length} of ${customers.length} customers match`,
    );
  });
});

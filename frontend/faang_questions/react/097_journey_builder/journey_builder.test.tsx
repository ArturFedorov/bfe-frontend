/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  ADDABLE_KINDS,
  decideByConfig,
  Journey,
  JourneyBuilder,
  Problem,
  simulate,
  SIMULATION_LIMIT,
  Step,
  validateJourney,
} from './journey_builder';

const step = (id: string, kind: Step['kind'], label: string, config: Record<string, unknown> = {}): Step => ({
  id,
  kind,
  label,
  config,
});

/** trigger → wait → branch(opened?) → yes: discount / no: reminder → exit */
const journey: Journey = {
  steps: [
    step('t', 'trigger', 'Signed up'),
    step('w', 'wait', 'Wait 1 day', { days: 1 }),
    step('b', 'branch', 'Opened email?', { field: 'opened' }),
    step('m1', 'message', 'Send discount'),
    step('m2', 'message', 'Send reminder'),
    step('x', 'exit', 'Done'),
  ],
  edges: [
    { from: 't', to: 'w' },
    { from: 'w', to: 'b' },
    { from: 'b', to: 'm1', when: 'yes' },
    { from: 'b', to: 'm2', when: 'no' },
    { from: 'm1', to: 'x' },
    { from: 'm2', to: 'x' },
  ],
};

const codes = (problems: Problem[]) => problems.map((p) => p.code);
const find = (problems: Problem[], code: Problem['code']) => problems.find((p) => p.code === code);

const treeitems = () => within(screen.getByRole('tree', { name: 'Journey steps' })).getAllByRole('treeitem');
const item = (name: string) => screen.getByRole('treeitem', { name });
const problems = () =>
  within(screen.getByRole('alert'))
    .getAllByRole('listitem')
    .map((li) => li.textContent);
const path = () =>
  within(screen.getByRole('list', { name: 'Path' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

function setup(value: Journey = journey) {
  const onChange = jest.fn();
  let n = 0;
  render(<JourneyBuilder value={value} onChange={onChange} newId={() => `n${++n}`} />);
  return { onChange };
}

function Controlled({ initial, spy }: { initial: Journey; spy: jest.Mock }) {
  const [value, setValue] = useState(initial);
  return (
    <JourneyBuilder
      value={value}
      onChange={(next) => {
        spy(next);
        setValue(next);
      }}
      newId={() => 'new'}
    />
  );
}

describe('097 journey builder — validateJourney', () => {
  it('returns no problems for a well-formed journey', () => {
    expect(validateJourney(journey)).toEqual([]);
  });

  it('reports no_trigger and multiple_triggers', () => {
    const none = { ...journey, steps: journey.steps.filter((s) => s.kind !== 'trigger') };
    expect(find(validateJourney(none), 'no_trigger')).toMatchObject({ stepIds: [] });

    const two: Journey = {
      steps: [...journey.steps, step('t2', 'trigger', 'Bought')],
      edges: [...journey.edges, { from: 't2', to: 'w' }],
    };
    expect(find(validateJourney(two), 'multiple_triggers')).toMatchObject({ stepIds: ['t', 't2'] });
  });

  it('finds a cycle with its step ids in path order and labels in the message', () => {
    const cyclic: Journey = {
      steps: [step('t', 'trigger', 'Start'), step('a', 'wait', 'Wait A'), step('b', 'message', 'Msg B'), step('x', 'exit', 'Done')],
      edges: [
        { from: 't', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    };
    const cycle = find(validateJourney(cyclic), 'cycle');
    expect(cycle).toBeDefined();
    expect(cycle!.stepIds).toEqual(['a', 'b']);
    expect(cycle!.message).toBe('Cycle: Wait A → Msg B');
  });

  it('reports unreachable steps via BFS from the trigger', () => {
    const j: Journey = {
      steps: [...journey.steps, step('o', 'message', 'Orphan'), step('o2', 'exit', 'Orphan exit')],
      edges: [...journey.edges, { from: 'o', to: 'o2' }],
    };
    expect(find(validateJourney(j), 'unreachable')).toEqual({
      code: 'unreachable',
      stepIds: ['o', 'o2'],
      message: 'Unreachable steps: Orphan, Orphan exit',
    });
  });

  it('reports dangling branches with the three message variants', () => {
    const noNo = { ...journey, edges: journey.edges.filter((e) => e.when !== 'no') };
    expect(find(validateJourney(noNo), 'dangling_branch')).toMatchObject({
      stepIds: ['b'],
      message: 'Branch "Opened email?" is missing a no path',
    });
    const noYes = { ...journey, edges: journey.edges.filter((e) => e.when !== 'yes') };
    expect(find(validateJourney(noYes), 'dangling_branch')!.message).toBe('Branch "Opened email?" is missing a yes path');
    const neither = { ...journey, edges: journey.edges.filter((e) => e.from !== 'b') };
    expect(find(validateJourney(neither), 'dangling_branch')!.message).toBe(
      'Branch "Opened email?" is missing yes and no paths',
    );
  });

  it('reports dead ends (non-branch, non-exit steps without an outgoing edge) as missing_exit', () => {
    const j: Journey = {
      steps: [step('t', 'trigger', 'Start'), step('m', 'message', 'Hello')],
      edges: [{ from: 't', to: 'm' }],
    };
    expect(find(validateJourney(j), 'missing_exit')).toEqual({
      code: 'missing_exit',
      stepIds: ['m'],
      message: 'Dead end without exit: Hello',
    });
  });

  it('ignores edges that point at or come from missing steps', () => {
    const j: Journey = {
      ...journey,
      edges: [...journey.edges.filter((e) => e.when !== 'yes'), { from: 'b', to: 'ghost', when: 'yes' }, { from: 'ghost', to: 'x' }],
    };
    const result = validateJourney(j);
    expect(codes(result)).toEqual(['unreachable', 'dangling_branch']);
    expect(find(result, 'unreachable')!.stepIds).toEqual(['m1']);
    expect(find(result, 'dangling_branch')!.message).toBe('Branch "Opened email?" is missing a yes path');
  });

  it('orders problems by code: triggers, cycle, unreachable, dangling, missing_exit', () => {
    const messy: Journey = {
      steps: [step('a', 'wait', 'A'), step('b', 'branch', 'B'), step('c', 'message', 'C')],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a', when: 'yes' },
      ],
    };
    expect(codes(validateJourney(messy))).toEqual(['no_trigger', 'cycle', 'dangling_branch', 'missing_exit']);
  });
});

describe('097 journey builder — simulate', () => {
  it('follows the yes and no paths using the decide function', () => {
    expect(simulate(journey, { opened: true }, decideByConfig)).toEqual(['t', 'w', 'b', 'm1', 'x']);
    expect(simulate(journey, { opened: false }, decideByConfig)).toEqual(['t', 'w', 'b', 'm2', 'x']);
  });

  it('passes the branch step and the customer to a custom decide', () => {
    const decide = jest.fn(() => false);
    const customer = { plan: 'pro' };
    simulate(journey, customer, decide);
    expect(decide).toHaveBeenCalledTimes(1);
    expect(decide).toHaveBeenCalledWith(journey.steps[2], customer);
  });

  it('decideByConfig compares with equals when present and uses truthiness otherwise', () => {
    expect(decideByConfig(step('b', 'branch', 'Plan?', { field: 'plan', equals: 'pro' }), { plan: 'pro' })).toBe(true);
    expect(decideByConfig(step('b', 'branch', 'Plan?', { field: 'plan', equals: 'pro' }), { plan: 'free' })).toBe(false);
    expect(decideByConfig(step('b', 'branch', 'Opened?', { field: 'opened' }), { opened: 1 })).toBe(true);
    expect(decideByConfig(step('b', 'branch', 'Opened?', { field: 'opened' }), {})).toBe(false);
  });

  it('stops at a dead end or a missing target and returns the ids so far; no trigger gives []', () => {
    const dead: Journey = { steps: [step('t', 'trigger', 'Start'), step('m', 'message', 'Hi')], edges: [{ from: 't', to: 'm' }] };
    expect(simulate(dead, {}, decideByConfig)).toEqual(['t', 'm']);
    const ghost: Journey = { ...dead, edges: [{ from: 't', to: 'nope' }] };
    expect(simulate(ghost, {}, decideByConfig)).toEqual(['t']);
    expect(simulate({ steps: [step('m', 'message', 'Hi')], edges: [] }, {}, decideByConfig)).toEqual([]);
  });

  it('senior: a cyclic journey stops at the simulation limit', () => {
    const cyclic: Journey = {
      steps: [step('t', 'trigger', 'Start'), step('a', 'wait', 'A'), step('b', 'message', 'B')],
      edges: [
        { from: 't', to: 'a' },
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    };
    const visited = simulate(cyclic, {}, decideByConfig);
    expect(visited).toHaveLength(SIMULATION_LIMIT);
    expect(visited.slice(0, 4)).toEqual(['t', 'a', 'b', 'a']);
  });
});

describe('097 journey builder — outline', () => {
  it('renders one treeitem per step with "<label> (<kind>)" as its name', () => {
    setup();
    expect(treeitems().map((el) => el.getAttribute('aria-label'))).toEqual([
      'Signed up (trigger)',
      'Wait 1 day (wait)',
      'Opened email? (branch)',
      'Send discount (message)',
      'Send reminder (message)',
      'Done (exit)',
    ]);
    expect(within(item('Done (exit)')).queryByRole('button', { name: 'Add step after' })).not.toBeInTheDocument();
    expect(within(item('Wait 1 day (wait)')).getByRole('button', { name: 'Add step after' })).toBeInTheDocument();
  });

  it('renders no alert for a valid journey and lists problems for an invalid one', () => {
    const { unmount } = render(<JourneyBuilder value={journey} onChange={jest.fn()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    unmount();
    render(<JourneyBuilder value={{ ...journey, steps: journey.steps.filter((s) => s.id !== 't') }} onChange={jest.fn()} />);
    expect(problems()).toContain('Journey has no trigger');
  });
});

describe('097 journey builder — Add step after', () => {
  it('opens a kind select and inserts the new step between the step and its old target', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    const wait = item('Wait 1 day (wait)');
    expect(within(wait).queryByLabelText('New step kind')).not.toBeInTheDocument();
    await user.click(within(wait).getByRole('button', { name: 'Add step after' }));
    const select = within(wait).getByLabelText('New step kind');
    expect(
      within(select)
        .getAllByRole('option')
        .slice(1)
        .map((o) => o.textContent),
    ).toEqual([...ADDABLE_KINDS]);

    await user.selectOptions(select, 'message');
    expect(onChange).toHaveBeenCalledTimes(1);
    const next: Journey = onChange.mock.calls[0][0];
    expect(next.steps.map((s) => s.id)).toEqual(['t', 'w', 'n1', 'b', 'm1', 'm2', 'x']);
    expect(next.steps[2]).toEqual({ id: 'n1', kind: 'message', label: 'Message', config: {} });
    expect(next.edges).toContainEqual({ from: 'w', to: 'n1' });
    expect(next.edges).toContainEqual({ from: 'n1', to: 'b' });
    expect(next.edges).not.toContainEqual({ from: 'w', to: 'b' });
    expect(next.edges).toHaveLength(journey.edges.length + 1);
  });

  it('hides the kind select after inserting (parent applies the change)', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={journey} spy={jest.fn()} />);
    const wait = item('Wait 1 day (wait)');
    await user.click(within(wait).getByRole('button', { name: 'Add step after' }));
    await user.selectOptions(within(wait).getByLabelText('New step kind'), 'wait');
    expect(within(item('Wait 1 day (wait)')).queryByLabelText('New step kind')).not.toBeInTheDocument();
    expect(treeitems()).toHaveLength(7);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('after a branch the new step gets no edges and is reported as unreachable', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={journey} spy={jest.fn()} />);
    const branch = item('Opened email? (branch)');
    await user.click(within(branch).getByRole('button', { name: 'Add step after' }));
    await user.selectOptions(within(branch).getByLabelText('New step kind'), 'message');
    expect(treeitems().map((el) => el.getAttribute('aria-label'))[3]).toBe('Message (message)');
    expect(problems()).toContain('Unreachable steps: Message');
  });
});

describe('097 journey builder — Delete', () => {
  it('removes the step and every edge touching it', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await user.click(within(item('Send discount (message)')).getByRole('button', { name: 'Delete' }));
    const next: Journey = onChange.mock.calls[0][0];
    expect(next.steps.map((s) => s.id)).toEqual(['t', 'w', 'b', 'm2', 'x']);
    expect(next.edges).toEqual([
      { from: 't', to: 'w' },
      { from: 'w', to: 'b' },
      { from: 'b', to: 'm2', when: 'no' },
      { from: 'm2', to: 'x' },
    ]);
  });

  it('is fully controlled: a parent that ignores onChange leaves the outline unchanged', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(within(item('Send discount (message)')).getByRole('button', { name: 'Delete' }));
    expect(treeitems()).toHaveLength(6);
  });

  it('senior: deleting the yes target leaves the branch dangling and the alert says so immediately', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={journey} spy={jest.fn()} />);
    await user.click(within(item('Send discount (message)')).getByRole('button', { name: 'Delete' }));
    expect(problems()).toEqual(['Branch "Opened email?" is missing a yes path']);
    expect(within(item('Opened email? (branch)')).getByLabelText('Yes →')).toHaveValue('');
  });
});

describe('097 journey builder — branch targets', () => {
  it('Yes → / No → show the current targets and exclude the branch itself', () => {
    setup();
    const branch = item('Opened email? (branch)');
    const yes = within(branch).getByLabelText('Yes →') as HTMLSelectElement;
    const no = within(branch).getByLabelText('No →') as HTMLSelectElement;
    expect(yes).toHaveValue('m1');
    expect(no).toHaveValue('m2');
    const options = within(yes)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(['', 'Signed up', 'Wait 1 day', 'Send discount', 'Send reminder', 'Done']);
  });

  it('changing No → replaces the branch no edge', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    await user.selectOptions(within(item('Opened email? (branch)')).getByLabelText('No →'), 'x');
    const next: Journey = onChange.mock.calls[0][0];
    expect(next.edges.filter((e) => e.from === 'b')).toEqual([
      { from: 'b', to: 'm1', when: 'yes' },
      { from: 'b', to: 'x', when: 'no' },
    ]);
    expect(next.edges).toHaveLength(journey.edges.length);
  });

  it('senior: pointing No → upstream creates a cycle that is reported immediately', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={journey} spy={jest.fn()} />);
    await user.selectOptions(within(item('Opened email? (branch)')).getByLabelText('No →'), 'w');
    const list = problems();
    const cycle = list.find((m) => m?.startsWith('Cycle: '));
    expect(cycle).toContain('Wait 1 day');
    expect(cycle).toContain('Opened email?');
    expect(list).toContain('Unreachable steps: Send reminder');
  });
});

describe('097 journey builder — Simulate', () => {
  it('shows the visited labels for the yes and the no customer', async () => {
    const user = userEvent.setup();
    setup();
    expect(path()).toEqual([]);
    fireEvent.change(screen.getByLabelText('Customer JSON'), { target: { value: '{"opened": true}' } });
    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    expect(path()).toEqual(['Signed up', 'Wait 1 day', 'Opened email?', 'Send discount', 'Done']);

    fireEvent.change(screen.getByLabelText('Customer JSON'), { target: { value: '{"opened": false}' } });
    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    expect(path()).toEqual(['Signed up', 'Wait 1 day', 'Opened email?', 'Send reminder', 'Done']);
  });

  it('invalid JSON shows a status message and clears the path', async () => {
    const user = userEvent.setup();
    setup();
    fireEvent.change(screen.getByLabelText('Customer JSON'), { target: { value: '{"opened": true}' } });
    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    expect(path()).toHaveLength(5);
    fireEvent.change(screen.getByLabelText('Customer JSON'), { target: { value: '{opened' } });
    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    expect(screen.getByRole('status')).toHaveTextContent('Invalid customer JSON');
    expect(path()).toEqual([]);
  });

  it('uses the decide prop when provided', async () => {
    const user = userEvent.setup();
    render(<JourneyBuilder value={journey} onChange={jest.fn()} decide={() => true} />);
    fireEvent.change(screen.getByLabelText('Customer JSON'), { target: { value: '{"opened": false}' } });
    await user.click(screen.getByRole('button', { name: 'Simulate' }));
    expect(path()).toContain('Send discount');
  });
});

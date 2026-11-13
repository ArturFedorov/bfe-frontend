/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TransferList, moveIds, partition, type TransferItem } from './transfer_list';

const ITEMS: TransferItem[] = [
  { id: 'a', label: 'Alpha trailer' },
  { id: 'b', label: 'Beta cut' },
  { id: 'c', label: 'Gamma teaser' },
  { id: 'd', label: 'Delta trailer' },
];

function Harness({
  initial = [],
  onChange,
  titles,
}: {
  initial?: string[];
  onChange?: (next: Set<string>) => void;
  titles?: { left: string; right: string };
}) {
  const [value, setValue] = useState(() => new Set(initial));
  return (
    <TransferList
      items={ITEMS}
      value={value}
      titles={titles}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

const listbox = (name: string) => screen.getByRole('listbox', { name });
const optionsIn = (name: string) => within(listbox(name)).getAllByRole('option');
const option = (list: string, label: string) => within(listbox(list)).getByRole('option', { name: label });
const button = (name: string) => screen.getByRole('button', { name });
const labelsIn = (name: string) =>
  within(listbox(name))
    .queryAllByRole('option')
    .map((o) => o.textContent);

describe('pure: partition / moveIds', () => {
  it('partition keeps items order on the left and value insertion order on the right', () => {
    const { left, right } = partition(ITEMS, new Set(['d', 'a']));
    expect(left.map((i) => i.id)).toEqual(['b', 'c']);
    expect(right.map((i) => i.id)).toEqual(['d', 'a']);
  });

  it('partition skips ids in value that have no item', () => {
    const { left, right } = partition(ITEMS, new Set(['zzz', 'b']));
    expect(left.map((i) => i.id)).toEqual(['a', 'c', 'd']);
    expect(right.map((i) => i.id)).toEqual(['b']);
  });

  it('moveIds right appends in the given order and never mutates the input', () => {
    const before = new Set(['c']);
    const next = moveIds(before, ['b', 'a'], 'right');
    expect([...next]).toEqual(['c', 'b', 'a']);
    expect([...before]).toEqual(['c']);
    expect(next).not.toBe(before);
  });

  it('moveIds left removes the ids and ignores ids that are not present', () => {
    const next = moveIds(new Set(['a', 'b', 'c']), ['b', 'zzz'], 'left');
    expect([...next]).toEqual(['a', 'c']);
  });
});

describe('1. two multiselectable listboxes', () => {
  it('renders Available / Selected listboxes with aria-multiselectable and the right options', () => {
    render(<Harness initial={['c']} />);
    expect(listbox('Available')).toHaveAttribute('aria-multiselectable', 'true');
    expect(listbox('Selected')).toHaveAttribute('aria-multiselectable', 'true');
    expect(labelsIn('Available')).toEqual(['Alpha trailer', 'Beta cut', 'Delta trailer']);
    expect(labelsIn('Selected')).toEqual(['Gamma teaser']);
  });

  it('honours custom titles for listboxes and filters', () => {
    render(<Harness titles={{ left: 'Library', right: 'Playlist' }} />);
    expect(listbox('Library')).toBeInTheDocument();
    expect(listbox('Playlist')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filter library' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filter playlist' })).toBeInTheDocument();
  });

  it('right-hand order follows move order, not items order', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(option('Available', 'Delta trailer'));
    await user.click(button('Move selected right'));
    await user.click(option('Available', 'Alpha trailer'));
    await user.click(button('Move selected right'));
    expect(labelsIn('Selected')).toEqual(['Delta trailer', 'Alpha trailer']);
  });
});

describe('2. highlighting is not membership', () => {
  it('clicking an option toggles aria-selected without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const alpha = option('Available', 'Alpha trailer');
    expect(alpha).toHaveAttribute('aria-selected', 'false');
    await user.click(alpha);
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    await user.click(alpha);
    expect(alpha).toHaveAttribute('aria-selected', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('options start unhighlighted on both sides', () => {
    render(<Harness initial={['a']} />);
    for (const o of [...optionsIn('Available'), ...optionsIn('Selected')]) {
      expect(o).toHaveAttribute('aria-selected', 'false');
    }
  });
});

describe('3. filtering', () => {
  it('filters each side by case-insensitive substring', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['c']} />);
    await user.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'TRAIL');
    expect(labelsIn('Available')).toEqual(['Alpha trailer', 'Delta trailer']);
    expect(labelsIn('Selected')).toEqual(['Gamma teaser']);
    await user.type(screen.getByRole('searchbox', { name: 'Filter selected' }), 'nope');
    expect(labelsIn('Selected')).toEqual([]);
  });

  it('clears the highlight of items hidden by the filter', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(option('Available', 'Beta cut'));
    await user.click(option('Available', 'Alpha trailer'));
    const filter = screen.getByRole('searchbox', { name: 'Filter available' });
    await user.type(filter, 'trailer');
    expect(option('Available', 'Alpha trailer')).toHaveAttribute('aria-selected', 'true');
    await user.clear(filter);
    expect(option('Available', 'Beta cut')).toHaveAttribute('aria-selected', 'false');
    expect(option('Available', 'Alpha trailer')).toHaveAttribute('aria-selected', 'true');
  });
});

describe('4. move buttons', () => {
  it('disables every button that has nothing to act on', () => {
    render(<Harness />);
    expect(button('Move selected right')).toBeDisabled();
    expect(button('Move selected left')).toBeDisabled();
    expect(button('Move all right')).toBeEnabled();
    expect(button('Move all left')).toBeDisabled();
  });

  it('Move selected right / left move the highlighted ids and call onChange with a new Set', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness initial={['d']} onChange={onChange} />);
    await user.click(option('Available', 'Beta cut'));
    await user.click(option('Available', 'Gamma teaser'));
    await user.click(button('Move selected right'));
    expect(onChange).toHaveBeenLastCalledWith(new Set(['d', 'b', 'c']));
    expect(labelsIn('Selected')).toEqual(['Delta trailer', 'Beta cut', 'Gamma teaser']);

    await user.click(option('Selected', 'Delta trailer'));
    await user.click(button('Move selected left'));
    expect(onChange).toHaveBeenLastCalledWith(new Set(['b', 'c']));
    expect(labelsIn('Available')).toEqual(['Alpha trailer', 'Delta trailer']);
  });

  it('Move all left empties the right side', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['a', 'b']} />);
    await user.click(button('Move all left'));
    expect(labelsIn('Selected')).toEqual([]);
    expect(labelsIn('Available')).toHaveLength(4);
    expect(button('Move all left')).toBeDisabled();
  });

  it('senior: Move all right with a filter active moves only the filtered items', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    await user.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'trailer');
    await user.click(button('Move all right'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(new Set(['a', 'd']));
    expect(labelsIn('Selected')).toEqual(['Alpha trailer', 'Delta trailer']);
    expect(labelsIn('Available')).toEqual([]);
    expect(button('Move all right')).toBeDisabled();
  });

  it('senior: highlights do not survive a move', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(option('Available', 'Alpha trailer'));
    await user.click(option('Available', 'Beta cut'));
    await user.click(button('Move selected right'));
    expect(option('Selected', 'Alpha trailer')).toHaveAttribute('aria-selected', 'false');
    expect(option('Selected', 'Beta cut')).toHaveAttribute('aria-selected', 'false');
    expect(button('Move selected right')).toBeDisabled();
    expect(button('Move selected left')).toBeDisabled();
  });
});

describe('5. keyboard', () => {
  it('uses a roving tabindex: ArrowDown / ArrowUp move focus within the listbox', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const [alpha, beta, gamma] = optionsIn('Available');
    expect(alpha).toHaveAttribute('tabindex', '0');
    expect(beta).toHaveAttribute('tabindex', '-1');
    await user.tab(); // filter input
    await user.tab(); // listbox active option
    expect(alpha).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(gamma).toHaveFocus();
    expect(gamma).toHaveAttribute('tabindex', '0');
    expect(alpha).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowUp}');
    expect(beta).toHaveFocus();
  });

  it('Space toggles the highlight of the focused option', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const alpha = option('Available', 'Alpha trailer');
    act(() => alpha.focus());
    await user.keyboard(' ');
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    await user.keyboard(' ');
    expect(alpha).toHaveAttribute('aria-selected', 'false');
  });

  it('Shift+ArrowDown extends the highlight to the next option', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const [alpha, beta, gamma] = optionsIn('Available');
    act(() => alpha.focus());
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(beta).toHaveAttribute('aria-selected', 'true');
    expect(gamma).toHaveAttribute('aria-selected', 'true');
    expect(gamma).toHaveFocus();
    expect(button('Move selected right')).toBeEnabled();
  });

  it('Ctrl+A highlights every visible option only', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'trailer');
    act(() => option('Available', 'Alpha trailer').focus());
    await user.keyboard('{Control>}a{/Control}');
    expect(option('Available', 'Alpha trailer')).toHaveAttribute('aria-selected', 'true');
    expect(option('Available', 'Delta trailer')).toHaveAttribute('aria-selected', 'true');
    await user.clear(screen.getByRole('searchbox', { name: 'Filter available' }));
    expect(option('Available', 'Beta cut')).toHaveAttribute('aria-selected', 'false');
  });
});

describe('6. status', () => {
  it('announces "N of M selected" and updates after a move', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['a']} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 of 4 selected');
    await user.click(button('Move all right'));
    expect(screen.getByRole('status')).toHaveTextContent('4 of 4 selected');
  });
});

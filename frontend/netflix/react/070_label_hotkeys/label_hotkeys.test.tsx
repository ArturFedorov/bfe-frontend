/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabelHotkeys, Assignments, LabelItem, LabelOption } from './label_hotkeys';

const labels: LabelOption[] = [
  { key: '1', name: 'Positive' },
  { key: '2', name: 'Negative' },
  { key: '3', name: 'Neutral' },
  { key: '4', name: 'Spam' },
];

const items: LabelItem[] = [
  { id: 'u1', text: 'Loved the new episode!' },
  { id: 'u2', text: 'Player keeps buffering.' },
  { id: 'u3', text: 'It was fine I guess.' },
  { id: 'u4', text: 'FREE GIFT CARDS click here' },
];

function setup(value: Assignments = {}) {
  const onChange = jest.fn();
  const user = userEvent.setup();
  const utils = render(
    <LabelHotkeys items={items} labels={labels} value={value} onChange={onChange} />
  );
  const options = () => within(screen.getByRole('listbox', { name: 'Items' })).getAllByRole('option');
  return { onChange, user, options, ...utils };
}

function normalize(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

describe('LabelHotkeys', () => {
  it('renders a listbox of options with roving tabindex and the first item active', () => {
    const { options } = setup();

    const opts = options();
    expect(opts).toHaveLength(items.length);
    items.forEach((item, i) => expect(opts[i]).toHaveTextContent(item.text));

    expect(opts[0]).toHaveAttribute('aria-selected', 'true');
    opts.slice(1).forEach((opt) => expect(opt).toHaveAttribute('aria-selected', 'false'));

    expect(opts.filter((opt) => opt.tabIndex === 0)).toEqual([opts[0]]);
    opts.slice(1).forEach((opt) => expect(opt.tabIndex).toBe(-1));
  });

  it('renders a legend with each label as <kbd>key</kbd> name', () => {
    const { container } = setup();

    const kbds = Array.from(container.querySelectorAll('kbd')).map((el) => el.textContent);
    expect(kbds).toEqual(['1', '2', '3', '4']);

    labels.forEach((label) => {
      const kbd = Array.from(container.querySelectorAll('kbd')).find(
        (el) => el.textContent === label.key
      );
      expect(normalize(kbd?.parentElement?.textContent ?? null)).toBe(`${label.key} ${label.name}`);
    });
  });

  it('moves the active item and DOM focus with ArrowDown/ArrowUp and j/k, without wrapping', async () => {
    const { user, options } = setup();

    await user.tab();
    expect(options()[0]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(options()[1]).toHaveFocus();
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    expect(options()[0]).toHaveAttribute('aria-selected', 'false');
    expect(options()[1].tabIndex).toBe(0);
    expect(options()[0].tabIndex).toBe(-1);

    await user.keyboard('j');
    expect(options()[2]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(options()[1]).toHaveFocus();

    await user.keyboard('k');
    expect(options()[0]).toHaveFocus();

    // does not wrap at the top
    await user.keyboard('{ArrowUp}');
    expect(options()[0]).toHaveFocus();
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');

    // does not wrap at the bottom
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(options()[3]).toHaveFocus();
    expect(options()[3]).toHaveAttribute('aria-selected', 'true');
    expect(options().filter((opt) => opt.tabIndex === 0)).toEqual([options()[3]]);
  });

  it('labels the active item on a digit and advances to the next item', async () => {
    const { user, options, onChange } = setup({ u3: '3' });

    await user.tab();
    await user.keyboard('1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ u1: '1', u3: '3' });
    expect(options()[1]).toHaveFocus();
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    expect(options()[1].tabIndex).toBe(0);
  });

  it('does not advance past the last item after labeling it', async () => {
    const { user, options, onChange } = setup();

    await user.tab();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(options()[3]).toHaveFocus();

    await user.keyboard('4');
    expect(onChange).toHaveBeenCalledWith({ u4: '4' });
    expect(options()[3]).toHaveFocus();
    expect(options()[3]).toHaveAttribute('aria-selected', 'true');
  });

  it('clears the active item on Backspace, preserving other assignments', async () => {
    const { user, onChange } = setup({ u1: '1', u2: '2' });

    await user.tab();
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Assignments;
    expect(next.u1).toBeUndefined();
    expect(next.u2).toBe('2');
  });

  it('shows the label name inside a labeled option and describes it via aria-describedby', () => {
    const { options } = setup({ u1: '1', u4: '4' });

    const [first, second, , fourth] = options();
    expect(first).toHaveTextContent('Positive');
    const descId = first.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)).toHaveTextContent('Positive');

    expect(fourth).toHaveTextContent('Spam');
    expect(document.getElementById(fourth.getAttribute('aria-describedby')!)).toHaveTextContent(
      'Spam'
    );

    expect(second).not.toHaveAttribute('aria-describedby');
    expect(second).not.toHaveTextContent('Negative');
  });

  it('ignores hotkeys while typing in the Note textarea', async () => {
    const { user, onChange } = setup();

    const note = screen.getByRole('textbox', { name: 'Note' });
    await user.click(note);
    await user.keyboard('1j{Backspace}');

    expect(onChange).not.toHaveBeenCalled();
    expect(note).toHaveValue('1');
  });

  it('does nothing for a digit with no matching label', async () => {
    const { user, options, onChange } = setup();

    await user.tab();
    await user.keyboard('9');

    expect(onChange).not.toHaveBeenCalled();
    expect(options()[0]).toHaveFocus();
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('shows progress computed from value in a status region', () => {
    setup({ u1: '1', u2: '2', stale: '3' });
    expect(screen.getByRole('status')).toHaveTextContent('2 of 4 labeled');
  });

  it('is controlled: re-rendering with a new value updates labels and progress', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <LabelHotkeys items={items} labels={labels} value={{}} onChange={onChange} />
    );
    const options = () => within(screen.getByRole('listbox', { name: 'Items' })).getAllByRole('option');

    expect(options()[0]).not.toHaveTextContent('Positive');
    expect(screen.getByRole('status')).toHaveTextContent('0 of 4 labeled');

    rerender(
      <LabelHotkeys items={items} labels={labels} value={{ u1: '1', u2: '3' }} onChange={onChange} />
    );

    expect(options()[0]).toHaveTextContent('Positive');
    expect(options()[1]).toHaveTextContent('Neutral');
    expect(screen.getByRole('status')).toHaveTextContent('2 of 4 labeled');

    rerender(
      <LabelHotkeys items={items} labels={labels} value={{ u2: '3' }} onChange={onChange} />
    );
    expect(options()[0]).not.toHaveTextContent('Positive');
    expect(options()[0]).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('status')).toHaveTextContent('1 of 4 labeled');
  });
});

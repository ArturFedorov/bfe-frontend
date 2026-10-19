/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpanLabeler, Span } from './span_labeler';

const TOKENS = ['Tim', 'Cook', 'joined', 'Apple', 'in', 'August', '1998', '.'];
const LABELS = ['PERSON', 'ORG', 'DATE'];

function setup(value: Span[] = []) {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const utils = render(
    <SpanLabeler tokens={TOKENS} labels={LABELS} value={value} onChange={onChange} />
  );
  return { user, onChange, ...utils };
}

function token(name: string) {
  return within(screen.getByRole('group', { name: 'Tokens' })).getByRole('button', { name });
}

function pressedTokens(): string[] {
  return within(screen.getByRole('group', { name: 'Tokens' }))
    .getAllByRole('button', { pressed: true })
    .map((b) => b.textContent ?? '');
}

async function shiftClick(user: ReturnType<typeof userEvent.setup>, el: HTMLElement) {
  await user.keyboard('{Shift>}');
  await user.click(el);
  await user.keyboard('{/Shift}');
}

describe('SpanLabeler', () => {
  it('renders every token as a button, in order, inside the Tokens group', () => {
    setup();
    const group = screen.getByRole('group', { name: 'Tokens' });
    const names = within(group)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual(TOKENS);
    expect(screen.queryByRole('button', { name: 'PERSON' })).not.toBeInTheDocument();
  });

  it('click sets the anchor; shift+click extends the selection forward', async () => {
    const { user } = setup();
    await user.click(token('Tim'));
    expect(pressedTokens()).toEqual(['Tim']);

    await shiftClick(user, token('joined'));
    expect(pressedTokens()).toEqual(['Tim', 'Cook', 'joined']);
  });

  it('shift+click backwards selects the range between and normalises start <= end', async () => {
    const { user, onChange } = setup();
    await user.click(token('1998'));
    await shiftClick(user, token('August'));
    expect(pressedTokens()).toEqual(['August', '1998']);

    await user.click(screen.getByRole('button', { name: 'DATE' }));
    expect(onChange).toHaveBeenCalledWith([{ start: 5, end: 6, label: 'DATE' }]);
  });

  it('a plain click elsewhere restarts the selection', async () => {
    const { user } = setup();
    await user.click(token('Tim'));
    await shiftClick(user, token('Cook'));
    expect(pressedTokens()).toEqual(['Tim', 'Cook']);

    await user.click(token('Apple'));
    expect(pressedTokens()).toEqual(['Apple']);
  });

  it('shows the label palette only while a selection is pending and appends the span on pick', async () => {
    const { user, onChange } = setup([{ start: 3, end: 3, label: 'ORG' }]);
    expect(screen.queryByRole('button', { name: 'PERSON' })).not.toBeInTheDocument();

    await user.click(token('Tim'));
    await shiftClick(user, token('Cook'));
    for (const label of LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'PERSON' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      { start: 3, end: 3, label: 'ORG' },
      { start: 0, end: 1, label: 'PERSON' },
    ]);

    // pending selection is cleared, palette disappears
    expect(screen.queryByRole('button', { name: 'PERSON' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  });

  it('renders existing spans as <mark> with an accessible label', () => {
    const { container } = setup([
      { start: 0, end: 1, label: 'PERSON' },
      { start: 5, end: 6, label: 'DATE' },
    ]);
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveAttribute('aria-label', 'PERSON: Tim Cook');
    expect(marks[1]).toHaveAttribute('aria-label', 'DATE: August 1998');
    expect(within(marks[0]).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Tim',
      'Cook',
    ]);
  });

  it('clicking a token inside a span selects the span instead of starting a selection', async () => {
    const { user } = setup([{ start: 0, end: 1, label: 'PERSON' }]);
    await user.click(token('Cook'));

    expect(screen.getByLabelText('PERSON: Tim Cook')).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'PERSON' })).not.toBeInTheDocument();
  });

  it('rejects a shift+click range that crosses an existing span', async () => {
    const { user, onChange } = setup([{ start: 3, end: 3, label: 'ORG' }]);
    await user.click(token('Cook'));
    await shiftClick(user, token('August'));

    expect(screen.getByRole('alert')).toHaveTextContent('Spans cannot overlap');
    expect(pressedTokens()).toEqual(['Cook']);

    // shift+clicking directly into the span is also rejected
    await shiftClick(user, token('Apple'));
    expect(pressedTokens()).toEqual(['Cook']);
    expect(screen.getByLabelText('ORG: Apple')).not.toHaveAttribute('aria-selected', 'true');

    // a valid extension clears the alert
    await shiftClick(user, token('joined'));
    expect(pressedTokens()).toEqual(['Cook', 'joined']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Delete removes the selected span; Backspace works too', async () => {
    const value: Span[] = [
      { start: 0, end: 1, label: 'PERSON' },
      { start: 3, end: 3, label: 'ORG' },
    ];
    const { user, onChange } = setup(value);

    await user.click(token('Apple'));
    expect(screen.getByLabelText('ORG: Apple')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Delete}');
    expect(onChange).toHaveBeenLastCalledWith([{ start: 0, end: 1, label: 'PERSON' }]);

    await user.click(token('Tim'));
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith([{ start: 3, end: 3, label: 'ORG' }]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('Delete does nothing when no span is selected', async () => {
    const { user, onChange } = setup([{ start: 0, end: 1, label: 'PERSON' }]);
    await user.click(token('joined'));
    await user.keyboard('{Delete}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keyboard: arrows move focus, Space anchors, Shift+ArrowRight extends', async () => {
    const { user, onChange } = setup();
    token('Tim').focus();

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(token('joined')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(token('Cook')).toHaveFocus();

    await user.keyboard(' ');
    expect(pressedTokens()).toEqual(['Cook']);

    await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{/Shift}');
    expect(pressedTokens()).toEqual(['Cook', 'joined', 'Apple']);

    await user.click(screen.getByRole('button', { name: 'ORG' }));
    expect(onChange).toHaveBeenCalledWith([{ start: 1, end: 3, label: 'ORG' }]);
  });

  it('keyboard: Shift+ArrowLeft extends backwards and stops at an existing span', async () => {
    const { user } = setup([{ start: 3, end: 3, label: 'ORG' }]);
    token('1998').focus();
    await user.keyboard(' ');
    await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{/Shift}');
    expect(pressedTokens()).toEqual(['in', 'August', '1998']);

    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(pressedTokens()).toEqual(['in', 'August', '1998']);
    expect(screen.getByRole('alert')).toHaveTextContent('Spans cannot overlap');
  });

  it('lists every span in the Spans summary as LABEL: text', () => {
    setup([
      { start: 5, end: 6, label: 'DATE' },
      { start: 0, end: 1, label: 'PERSON' },
    ]);
    const items = within(screen.getByRole('list', { name: 'Spans' }))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toHaveLength(2);
    expect(items).toEqual(expect.arrayContaining(['PERSON: Tim Cook', 'DATE: August 1998']));
  });

  it('is fully controlled: rerendering with a new value re-renders the marks', () => {
    const onChange = jest.fn();
    const { container, rerender } = render(
      <SpanLabeler tokens={TOKENS} labels={LABELS} value={[]} onChange={onChange} />
    );
    expect(container.querySelectorAll('mark')).toHaveLength(0);

    rerender(
      <SpanLabeler
        tokens={TOKENS}
        labels={LABELS}
        value={[{ start: 3, end: 3, label: 'ORG' }]}
        onChange={onChange}
      />
    );
    expect(container.querySelectorAll('mark')).toHaveLength(1);
    expect(screen.getByLabelText('ORG: Apple')).toBeInTheDocument();

    rerender(<SpanLabeler tokens={TOKENS} labels={LABELS} value={[]} onChange={onChange} />);
    expect(container.querySelectorAll('mark')).toHaveLength(0);
  });
});

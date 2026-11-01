/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_THRESHOLD,
  Suggestion,
  SuggestionsPanel,
  filterSuggestions,
} from './suggestions_panel';

const SUGGESTIONS: Suggestion[] = [
  { id: 's1', label: 'PERSON', text: 'Ada Lovelace', confidence: 0.97, textVersion: 1 },
  { id: 's2', label: 'ORG', text: 'Analytical Engine Co', confidence: 0.9, textVersion: 1 },
  { id: 's3', label: 'DATE', text: '1843', confidence: 0.72, textVersion: 1 },
  { id: 's4', label: 'LOC', text: 'London', confidence: 0.5, textVersion: 1 },
  { id: 's5', label: 'MISC', text: 'notes', confidence: 0.31, textVersion: 1 },
];

const STALE: Suggestion[] = [
  { id: 'old1', label: 'PERSON', text: 'Charles', confidence: 0.99, textVersion: 0 },
  { id: 'old2', label: 'ORG', text: 'Babbage Ltd', confidence: 0.8, textVersion: 0 },
];

function setup(suggestions: Suggestion[] = SUGGESTIONS, textVersion = 1) {
  const onAccept = jest.fn();
  const onReject = jest.fn();
  const user = userEvent.setup();
  const utils = render(
    <SuggestionsPanel
      suggestions={suggestions}
      textVersion={textVersion}
      onAccept={onAccept}
      onReject={onReject}
    />,
  );
  const listbox = () => screen.getByRole('listbox', { name: 'Suggestions' });
  const options = () => within(listbox()).queryAllByRole('option');
  const slider = () => screen.getByRole('slider', { name: 'Confidence threshold' });
  const setThreshold = (value: number) =>
    fireEvent.change(slider(), { target: { value: String(value) } });
  return { onAccept, onReject, user, listbox, options, slider, setThreshold, ...utils };
}

describe('filterSuggestions (pure)', () => {
  it('keeps order and only suggestions at or above the threshold', () => {
    const ids = filterSuggestions(SUGGESTIONS, 1, 0.5).map((s) => s.id);
    expect(ids).toEqual(['s1', 's2', 's3', 's4']);
  });

  it('treats confidence === threshold as visible', () => {
    expect(filterSuggestions(SUGGESTIONS, 1, 0.9).map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('drops suggestions whose textVersion does not match', () => {
    const ids = filterSuggestions([...STALE, ...SUGGESTIONS], 1, 0).map((s) => s.id);
    expect(ids).toEqual(['s1', 's2', 's3', 's4', 's5']);
    expect(filterSuggestions([...STALE, ...SUGGESTIONS], 0, 0).map((s) => s.id)).toEqual([
      'old1',
      'old2',
    ]);
  });
});

describe('1. threshold slider', () => {
  it('renders a range slider labelled "Confidence threshold" with default 0.5 and step 0.05', () => {
    const { slider } = setup();
    const input = slider() as HTMLInputElement;
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('1');
    expect(input.step).toBe('0.05');
    expect(Number(input.value)).toBe(DEFAULT_THRESHOLD);
    expect(DEFAULT_THRESHOLD).toBe(0.5);
  });

  it('lists only suggestions with confidence >= 0.5 by default', () => {
    const { options } = setup();
    const opts = options();
    expect(opts).toHaveLength(4);
    expect(opts[0]).toHaveTextContent('Ada Lovelace');
    expect(opts[3]).toHaveTextContent('London');
    expect(screen.queryByText('notes')).not.toBeInTheDocument();
  });

  it('re-filters immediately when the slider moves', () => {
    const { options, setThreshold } = setup();
    setThreshold(0.9);
    expect(options().map((o) => o.textContent)).toEqual([
      expect.stringContaining('Ada Lovelace'),
      expect.stringContaining('Analytical Engine Co'),
    ]);
    setThreshold(0.3);
    expect(options()).toHaveLength(5);
  });
});

describe('2. listbox rendering', () => {
  it('renders options with label, text and confidence as a whole percentage', () => {
    const { options } = setup();
    const [first, , third] = options();
    expect(first).toHaveTextContent('PERSON');
    expect(first).toHaveTextContent('Ada Lovelace');
    expect(first).toHaveTextContent('97%');
    expect(third).toHaveTextContent('DATE');
    expect(third).toHaveTextContent('72%');
  });

  it('preserves the given order', () => {
    const { options } = setup();
    expect(options().map((o) => o.textContent)).toEqual([
      expect.stringContaining('PERSON'),
      expect.stringContaining('ORG'),
      expect.stringContaining('DATE'),
      expect.stringContaining('LOC'),
    ]);
  });
});

describe('3. per-item actions', () => {
  it('Accept on an option calls onAccept with just that id', async () => {
    const { user, options, onAccept, onReject } = setup();
    await user.click(within(options()[1]).getByRole('button', { name: 'Accept' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(['s2']);
    expect(onReject).not.toHaveBeenCalled();
  });

  it('Reject on an option calls onReject with that id', async () => {
    const { user, options, onAccept, onReject } = setup();
    await user.click(within(options()[2]).getByRole('button', { name: 'Reject' }));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('s3');
    expect(onAccept).not.toHaveBeenCalled();
  });
});

describe('4. accept all above threshold', () => {
  it('calls onAccept once with every visible id in display order', async () => {
    const { user, onAccept } = setup();
    await user.click(screen.getByRole('button', { name: 'Accept all above threshold' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(['s1', 's2', 's3', 's4']);
  });

  it('does not call onAccept when nothing is visible', async () => {
    const { user, onAccept, setThreshold } = setup();
    setThreshold(1);
    await user.click(screen.getByRole('button', { name: 'Accept all above threshold' }));
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('excludes stale suggestions even when their confidence passes', async () => {
    const { user, onAccept } = setup([...STALE, ...SUGGESTIONS], 1);
    await user.click(screen.getByRole('button', { name: 'Accept all above threshold' }));
    expect(onAccept).toHaveBeenCalledWith(['s1', 's2', 's3', 's4']);
  });
});

describe('5. keyboard navigation', () => {
  it('uses a roving tabindex with the first option active and selected', () => {
    const { options } = setup();
    const opts = options();
    expect(opts.filter((o) => o.tabIndex === 0)).toEqual([opts[0]]);
    expect(opts[0]).toHaveAttribute('aria-selected', 'true');
    opts.slice(1).forEach((o) => {
      expect(o.tabIndex).toBe(-1);
      expect(o).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('ArrowDown / ArrowUp move the active option and focus without wrapping', async () => {
    const { user, options } = setup();
    options()[0].focus();

    await user.keyboard('{ArrowDown}');
    expect(options()[1]).toHaveFocus();
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    expect(options()[1].tabIndex).toBe(0);
    expect(options()[0].tabIndex).toBe(-1);

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(options()[0]).toHaveFocus();
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(options()[3]).toHaveFocus();
    expect(options().filter((o) => o.tabIndex === 0)).toEqual([options()[3]]);
  });

  it('Enter accepts the active option', async () => {
    const { user, options, onAccept } = setup();
    options()[0].focus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(['s2']);
  });

  it('Delete rejects the active option', async () => {
    const { user, options, onReject, onAccept } = setup();
    options()[0].focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Delete}');
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledWith('s3');
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('clicking an option makes it active', async () => {
    const { user, options } = setup();
    await user.click(options()[2]);
    expect(options()[2]).toHaveAttribute('aria-selected', 'true');
    expect(options().filter((o) => o.tabIndex === 0)).toEqual([options()[2]]);
  });
});

describe('6. stale suggestions', () => {
  it('does not render suggestions whose textVersion differs from the prop', () => {
    const { options } = setup([...STALE, ...SUGGESTIONS], 1);
    expect(options()).toHaveLength(4);
    expect(screen.queryByText('Charles')).not.toBeInTheDocument();
    expect(screen.queryByText('Babbage Ltd')).not.toBeInTheDocument();
  });

  it('announces how many suggestions were discarded when textVersion changes', () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const { rerender } = render(
      <SuggestionsPanel
        suggestions={SUGGESTIONS}
        textVersion={1}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );
    expect(screen.queryByText(/discarded/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);

    rerender(
      <SuggestionsPanel
        suggestions={SUGGESTIONS}
        textVersion={2}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent(
      '5 suggestions discarded (text changed)',
    );
  });

  it('keeps suggestions computed for the new version and counts only the stale ones', () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const fresh: Suggestion = {
      id: 'n1',
      label: 'PERSON',
      text: 'Ada',
      confidence: 0.8,
      textVersion: 2,
    };
    const { rerender } = render(
      <SuggestionsPanel
        suggestions={SUGGESTIONS}
        textVersion={1}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );
    rerender(
      <SuggestionsPanel
        suggestions={[...SUGGESTIONS, fresh]}
        textVersion={2}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(1);
    expect(opts[0]).toHaveTextContent('Ada');
    expect(screen.getByRole('status')).toHaveTextContent(
      '5 suggestions discarded (text changed)',
    );
  });
});

describe('7. empty state', () => {
  it('shows "No suggestions above threshold" when nothing passes the filter', () => {
    const { setThreshold, options } = setup();
    expect(screen.queryByText('No suggestions above threshold')).not.toBeInTheDocument();
    setThreshold(1);
    expect(screen.getByText('No suggestions above threshold')).toBeInTheDocument();
    expect(options()).toHaveLength(0);
  });

  it('shows the empty state when every suggestion is stale', () => {
    setup(STALE, 1);
    expect(screen.getByText('No suggestions above threshold')).toBeInTheDocument();
  });
});

describe('senior', () => {
  it('accept-all after moving the slider to 0.9 passes only ids with confidence >= 0.9, once', async () => {
    const { user, onAccept, setThreshold } = setup();
    setThreshold(0.9);
    await user.click(screen.getByRole('button', { name: 'Accept all above threshold' }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(['s1', 's2']);
  });

  it('bumping textVersion while a non-first item is active moves the cursor to the first remaining item', async () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const user = userEvent.setup();
    const fresh: Suggestion[] = [
      { id: 'n1', label: 'ORG', text: 'Lovelace Labs', confidence: 0.6, textVersion: 2 },
      { id: 'n2', label: 'LOC', text: 'Paris', confidence: 0.55, textVersion: 2 },
    ];
    const { rerender } = render(
      <SuggestionsPanel
        suggestions={[...SUGGESTIONS, ...fresh]}
        textVersion={1}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );
    const options = () => screen.getAllByRole('option');
    options()[0].focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(options()[2]).toHaveAttribute('aria-selected', 'true');

    rerender(
      <SuggestionsPanel
        suggestions={[...SUGGESTIONS, ...fresh]}
        textVersion={2}
        onAccept={onAccept}
        onReject={onReject}
      />,
    );

    const remaining = options();
    expect(remaining).toHaveLength(2);
    expect(remaining[0]).toHaveTextContent('Lovelace Labs');
    expect(remaining[0]).toHaveAttribute('aria-selected', 'true');
    expect(remaining.filter((o) => o.tabIndex === 0)).toEqual([remaining[0]]);

    const listbox = screen.getByRole('listbox', { name: 'Suggestions' });
    const activeDescendant = listbox.getAttribute('aria-activedescendant');
    if (activeDescendant !== null) {
      expect(document.getElementById(activeDescendant)).toBe(remaining[0]);
    }

    // The cursor is usable immediately: Enter accepts the new first item.
    remaining[0].focus();
    await user.keyboard('{Enter}');
    expect(onAccept).toHaveBeenCalledWith(['n1']);
  });
});

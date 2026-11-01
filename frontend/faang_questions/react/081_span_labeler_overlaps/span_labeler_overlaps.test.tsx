/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Span, SpanLabeler } from './span_labeler_overlaps';

// Offsets (UTF-16 code units):
// "Tim Cook joined Apple 🍎 in 1998."
//  T=0 ' '=3 C=4 ' '=8 j=9 ' '=15 A=16 ' '=21 🍎=22..23 ' '=24 i=25 ' '=27 1=28 .=32  length=33
const TEXT = 'Tim Cook joined Apple 🍎 in 1998.';
const LABELS = ['PERSON', 'ORG', 'DATE', 'EVENT'];

const PERSON: Span = { id: 'p1', start: 0, end: 8, label: 'PERSON' };
const ORG: Span = { id: 'o1', start: 16, end: 21, label: 'ORG' };
const DATE: Span = { id: 'd1', start: 28, end: 32, label: 'DATE' };

function setup(value: Span[] = [], text = TEXT) {
  const user = userEvent.setup();
  const onChange = jest.fn();
  let n = 0;
  const newId = jest.fn(() => `s${++n}`);
  const utils = render(
    <SpanLabeler text={text} labels={LABELS} value={value} onChange={onChange} newId={newId} />
  );
  return { user, onChange, newId, ...utils };
}

const group = () => screen.getByRole('group', { name: 'Text' });

function segments(): HTMLElement[] {
  return Array.from(group().querySelectorAll<HTMLElement>('[data-segment]'));
}

function textNode(segment: HTMLElement): Text {
  const node = segment.firstChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) throw new Error('segment has no text node');
  return node as Text;
}

/**
 * jsdom has no layout, so a mouse drag cannot produce a selection. Build the
 * Range programmatically over the segment text nodes (exactly what the browser
 * would hand to window.getSelection()) and then fire mouseup on the container.
 */
function selectAndRelease(
  anchor: { segment: number; offset: number },
  focus: { segment: number; offset: number }
) {
  const segs = segments();
  const sel = window.getSelection();
  if (!sel) throw new Error('no selection');
  sel.removeAllRanges();
  sel.setBaseAndExtent(
    textNode(segs[anchor.segment]),
    anchor.offset,
    textNode(segs[focus.segment]),
    focus.offset
  );
  fireEvent.mouseUp(group());
}

function palette() {
  return screen.queryByRole('group', { name: 'Labels' });
}

function paletteButton(label: string) {
  return within(screen.getByRole('group', { name: 'Labels' })).getByRole('button', { name: label });
}

function selectedText(): string {
  return segments()
    .filter((s) => s.getAttribute('aria-selected') === 'true')
    .map((s) => s.textContent)
    .join('');
}

afterEach(() => {
  window.getSelection()?.removeAllRanges();
});

describe('SpanLabeler (overlapping spans)', () => {
  describe('rendering segments', () => {
    it('renders the whole text as segments split at every span boundary, labelled only where covered', () => {
      setup([PERSON, ORG]);
      const segs = segments();
      expect(segs.map((s) => s.textContent)).toEqual(['Tim Cook', ' joined ', 'Apple', ' 🍎 in 1998.']);
      expect(segs.map((s) => s.textContent).join('')).toBe(TEXT);

      expect(segs[0]).toHaveAttribute('data-labels', 'PERSON');
      expect(segs[0]).toHaveAttribute('aria-label', 'PERSON: Tim Cook');
      expect(segs[1]).toHaveAttribute('data-labels', '');
      expect(segs[1]).not.toHaveAttribute('aria-label');
      expect(segs[2]).toHaveAttribute('aria-label', 'ORG: Apple');
      expect(screen.getByLabelText('PERSON: Tim Cook')).toBeInTheDocument();
    });

    it('overlapping spans render a shared segment that carries both labels', () => {
      const JOB: Span = { id: 'j1', start: 4, end: 15, label: 'EVENT' }; // "Cook joined"
      setup([PERSON, JOB]);
      const segs = segments();
      expect(segs.map((s) => s.textContent)).toEqual(['Tim ', 'Cook', ' joined', ' Apple 🍎 in 1998.']);
      expect(segs[0]).toHaveAttribute('data-labels', 'PERSON');
      expect(segs[1]).toHaveAttribute('data-labels', 'PERSON,EVENT');
      expect(segs[1]).toHaveAttribute('aria-label', 'PERSON,EVENT: Cook');
      expect(segs[2]).toHaveAttribute('data-labels', 'EVENT');
      expect(segs[3]).toHaveAttribute('data-labels', '');
    });

    it('nested spans: the inner segment lists outer and inner labels, outer-only segments list one', () => {
      const OUTER: Span = { id: 'e1', start: 0, end: 21, label: 'EVENT' }; // "Tim Cook joined Apple"
      setup([OUTER, PERSON, ORG]);
      const segs = segments();
      expect(segs.map((s) => s.textContent)).toEqual(['Tim Cook', ' joined ', 'Apple', ' 🍎 in 1998.']);
      expect(segs[0]).toHaveAttribute('data-labels', 'EVENT,PERSON');
      expect(segs[1]).toHaveAttribute('data-labels', 'EVENT');
      expect(segs[2]).toHaveAttribute('data-labels', 'EVENT,ORG');
      expect(segs[3]).toHaveAttribute('data-labels', '');
    });

    it('lists every span in the Spans summary as LABEL: text', () => {
      setup([DATE, PERSON]);
      const items = within(screen.getByRole('list', { name: 'Spans' }))
        .getAllByRole('listitem')
        .map((li) => li.textContent);
      expect(items).toEqual(['DATE: 1998', 'PERSON: Tim Cook']);
      expect(palette()).not.toBeInTheDocument();
    });
  });

  describe('mouse selection', () => {
    it('a selection crossing two segments shows the palette; picking a label appends a span with container-relative offsets', async () => {
      const { user, onChange, newId } = setup([PERSON]);
      // segments: "Tim Cook" | " joined Apple 🍎 in 1998."
      selectAndRelease({ segment: 0, offset: 4 }, { segment: 1, offset: 7 }); // "Cook joined"

      for (const label of LABELS) expect(paletteButton(label)).toBeInTheDocument();
      await user.click(paletteButton('EVENT'));

      expect(newId).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith([PERSON, { id: 's1', start: 4, end: 15, label: 'EVENT' }]);
      expect(palette()).not.toBeInTheDocument();
    });

    it('a backwards selection (focus before anchor) is normalised so start < end', async () => {
      const { user, onChange } = setup([]);
      selectAndRelease({ segment: 0, offset: 32 }, { segment: 0, offset: 28 }); // "1998" dragged right-to-left
      await user.click(paletteButton('DATE'));
      expect(onChange).toHaveBeenCalledWith([{ id: 's1', start: 28, end: 32, label: 'DATE' }]);
    });

    it('a collapsed selection (plain click) does not open the palette', () => {
      setup([]);
      selectAndRelease({ segment: 0, offset: 5 }, { segment: 0, offset: 5 });
      expect(palette()).not.toBeInTheDocument();
    });

    it('a selection outside the labeler is ignored', () => {
      setup([]);
      const outside = document.createElement('p');
      outside.textContent = 'unrelated paragraph';
      document.body.appendChild(outside);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.setBaseAndExtent(outside.firstChild!, 0, outside.firstChild!, 9);
      fireEvent.mouseUp(group());
      expect(palette()).not.toBeInTheDocument();
      outside.remove();
    });

    it('a selection whose end lands inside an emoji snaps outward so no surrogate pair is split', async () => {
      const { user, onChange } = setup([]);
      // 🍎 occupies code units 22 and 23; offset 23 is between the two halves
      selectAndRelease({ segment: 0, offset: 16 }, { segment: 0, offset: 23 });
      await user.click(paletteButton('ORG'));
      expect(onChange).toHaveBeenLastCalledWith([{ id: 's1', start: 16, end: 24, label: 'ORG' }]);
      expect(TEXT.slice(16, 24)).toBe('Apple 🍎');
    });

    it('a selection whose start lands inside an emoji snaps outward too', async () => {
      const { user, onChange } = setup([]);
      selectAndRelease({ segment: 0, offset: 23 }, { segment: 0, offset: 27 });
      await user.click(paletteButton('ORG'));
      expect(onChange).toHaveBeenLastCalledWith([{ id: 's1', start: 22, end: 27, label: 'ORG' }]);
      expect(TEXT.slice(22, 27)).toBe('🍎 in');
    });
  });

  describe('keyboard', () => {
    it('Shift+ArrowRight extends the pending end by one code point, treating a surrogate pair as one step', async () => {
      const { user, onChange } = setup([]);
      selectAndRelease({ segment: 0, offset: 16 }, { segment: 0, offset: 21 }); // "Apple"
      segments()[0].focus();

      await user.keyboard('{Shift>}{ArrowRight}{/Shift}'); // " "  → end 22
      await user.keyboard('{Shift>}{ArrowRight}{/Shift}'); // "🍎" → end 24 (not 23)
      await user.click(paletteButton('ORG'));
      expect(onChange).toHaveBeenLastCalledWith([{ id: 's1', start: 16, end: 24, label: 'ORG' }]);
    });

    it('Shift+ArrowLeft retracts by one code point and never collapses the selection', async () => {
      const { user, onChange } = setup([]);
      selectAndRelease({ segment: 0, offset: 16 }, { segment: 0, offset: 24 }); // "Apple 🍎"
      segments()[0].focus();

      await user.keyboard('{Shift>}{ArrowLeft}{/Shift}'); // drops the whole emoji → end 22
      await user.click(paletteButton('ORG'));
      expect(onChange).toHaveBeenLastCalledWith([{ id: 's1', start: 16, end: 22, label: 'ORG' }]);

      selectAndRelease({ segment: 0, offset: 16 }, { segment: 0, offset: 17 }); // "A"
      segments()[0].focus();
      await user.keyboard('{Shift>}{ArrowLeft}{/Shift}'); // would collapse → no-op
      await user.click(paletteButton('ORG'));
      expect(onChange).toHaveBeenLastCalledWith([{ id: 's2', start: 16, end: 17, label: 'ORG' }]);
    });

    it('Escape discards the pending selection', async () => {
      const { user, onChange } = setup([]);
      selectAndRelease({ segment: 0, offset: 0 }, { segment: 0, offset: 3 });
      expect(palette()).toBeInTheDocument();
      segments()[0].focus();
      await user.keyboard('{Escape}');
      expect(palette()).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('existing spans', () => {
    it('clicking a single-label segment selects that span on all of its segments; Delete removes it by id', async () => {
      const INNER: Span = { id: 'i1', start: 4, end: 8, label: 'EVENT' }; // "Cook" nested in PERSON
      const { user, onChange } = setup([PERSON, INNER, ORG]);
      // segments: "Tim " (PERSON) | "Cook" (PERSON,EVENT) | " joined " | "Apple" (ORG) | rest
      await user.click(segments()[0]);
      expect(selectedText()).toBe('Tim Cook');
      expect(segments()[3]).not.toHaveAttribute('aria-selected', 'true');
      expect(palette()).not.toBeInTheDocument();

      await user.keyboard('{Delete}');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith([INNER, ORG]);
    });

    it('the Label combobox changes the selected span’s label and keeps its id', async () => {
      const { user, onChange } = setup([PERSON, ORG]);
      expect(screen.queryByRole('combobox', { name: 'Label' })).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('ORG: Apple'));
      const select = screen.getByRole('combobox', { name: 'Label' });
      expect(select).toHaveValue('ORG');

      await user.selectOptions(select, 'EVENT');
      expect(onChange).toHaveBeenCalledWith([PERSON, { ...ORG, label: 'EVENT' }]);
    });

    it('Delete with no selected span does nothing, and clicking a segment covered by two spans selects nothing', async () => {
      const INNER: Span = { id: 'i1', start: 4, end: 8, label: 'EVENT' };
      const { user, onChange } = setup([PERSON, INNER]);
      segments()[2].focus(); // unlabelled segment
      await user.keyboard('{Delete}{Backspace}');
      expect(onChange).not.toHaveBeenCalled();

      await user.click(segments()[1]); // "Cook": PERSON,EVENT — ambiguous
      expect(selectedText()).toBe('');
      await user.keyboard('{Delete}');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('controlled', () => {
    it('is fully controlled: rerendering with a new value re-splits the segments and the summary', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <SpanLabeler text={TEXT} labels={LABELS} value={[]} onChange={onChange} newId={() => 'x'} />
      );
      expect(segments()).toHaveLength(1);

      rerender(
        <SpanLabeler text={TEXT} labels={LABELS} value={[PERSON, DATE]} onChange={onChange} newId={() => 'x'} />
      );
      expect(segments().map((s) => s.textContent)).toEqual(['Tim Cook', ' joined Apple 🍎 in ', '1998', '.']);
      expect(within(screen.getByRole('list', { name: 'Spans' })).getAllByRole('listitem')).toHaveLength(2);

      rerender(<SpanLabeler text={TEXT} labels={LABELS} value={[]} onChange={onChange} newId={() => 'x'} />);
      expect(segments()).toHaveLength(1);
      expect(within(screen.getByRole('list', { name: 'Spans' })).queryAllByRole('listitem')).toHaveLength(0);
    });
  });
});

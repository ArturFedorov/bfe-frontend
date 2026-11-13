/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { StarRating, clampRating } from './star_rating';

const group = () => screen.getByRole('radiogroup', { name: 'Review score' });
const star = (n: number) => screen.getByRole('radio', { name: n === 1 ? '1 star' : `${n} stars` });
const fills = () => screen.getAllByRole('radio').map((r) => r.getAttribute('data-fill'));
const checkedStars = () => screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true');

function Harness({
  initial = 0,
  allowHalf,
  allowClear,
  spy,
}: {
  initial?: number;
  allowHalf?: boolean;
  allowClear?: boolean;
  spy?: (v: number) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <StarRating
      label="Review score"
      value={value}
      allowHalf={allowHalf}
      allowClear={allowClear}
      onChange={(v) => {
        spy?.(v);
        setValue(v);
      }}
    />
  );
}

describe('pure: clampRating', () => {
  it('clamps to [0, max] and rounds to whole stars by default', () => {
    expect(clampRating(7, 5, false)).toBe(5);
    expect(clampRating(-1, 5, false)).toBe(0);
    expect(clampRating(2.4, 5, false)).toBe(2);
    expect(clampRating(2.5, 5, false)).toBe(3);
  });

  it('rounds to the nearest half when allowHalf and maps NaN to 0', () => {
    expect(clampRating(2.6, 5, true)).toBe(2.5);
    expect(clampRating(2.76, 5, true)).toBe(3);
    expect(clampRating(0.2, 5, true)).toBe(0);
    expect(clampRating(NaN, 5, true)).toBe(0);
    expect(clampRating(9, 5, true)).toBe(5);
  });
});

describe('1. roles', () => {
  it('renders a named radiogroup with max radios, aria-checked on the value and data-fill per star', () => {
    render(<StarRating label="Review score" defaultValue={3} />);
    expect(group()).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(star(1)).toBeInTheDocument();
    expect(star(3)).toHaveAttribute('aria-checked', 'true');
    expect(checkedStars()).toHaveLength(1);
    expect(fills()).toEqual(['full', 'full', 'full', 'empty', 'empty']);
  });

  it('honours max', () => {
    render(<StarRating label="Review score" max={3} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(checkedStars()).toHaveLength(0);
  });
});

describe('2. hover preview', () => {
  it('previews the hovered star via data-preview and fills without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<StarRating label="Review score" defaultValue={2} onChange={onChange} />);
    expect(group()).not.toHaveAttribute('data-preview');

    await user.hover(star(4));
    expect(group()).toHaveAttribute('data-preview', '4');
    expect(fills()).toEqual(['full', 'full', 'full', 'full', 'empty']);
    expect(star(2)).toHaveAttribute('aria-checked', 'true');
    expect(onChange).not.toHaveBeenCalled();

    await user.unhover(star(4));
    expect(group()).not.toHaveAttribute('data-preview');
    expect(fills()).toEqual(['full', 'full', 'empty', 'empty', 'empty']);
  });
});

describe('3. click to set / clear', () => {
  it('clicking a star sets it (uncontrolled) and reports onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<StarRating label="Review score" onChange={onChange} />);
    await user.click(star(4));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(star(4)).toHaveAttribute('aria-checked', 'true');
    expect(fills()).toEqual(['full', 'full', 'full', 'full', 'empty']);
  });

  it('clicking the selected star clears to 0 by default, and does nothing with allowClear=false', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { unmount } = render(<StarRating label="Review score" defaultValue={3} onChange={onChange} />);
    await user.click(star(3));
    expect(onChange).toHaveBeenCalledWith(0);
    expect(checkedStars()).toHaveLength(0);
    await user.unhover(star(3)); // the pointer still previews star 3 until it leaves
    expect(fills()).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
    unmount();

    const noClear = jest.fn();
    render(<StarRating label="Review score" defaultValue={3} allowClear={false} onChange={noClear} />);
    await user.click(star(3));
    expect(noClear).not.toHaveBeenCalled();
    expect(star(3)).toHaveAttribute('aria-checked', 'true');
  });
});

describe('4. keyboard', () => {
  it('puts the single tab stop on the checked star, or the first star when the value is 0', () => {
    const { unmount } = render(<StarRating label="Review score" defaultValue={3} />);
    expect(star(3)).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('radio').filter((r) => r.tabIndex === 0)).toHaveLength(1);
    unmount();
    render(<StarRating label="Review score" />);
    expect(star(1)).toHaveAttribute('tabindex', '0');
    expect(star(2)).toHaveAttribute('tabindex', '-1');
  });

  it('arrows step by one, Home/End jump, and focus follows the checked star', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Harness initial={3} spy={spy} />);
    await user.tab();
    expect(star(3)).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(spy).toHaveBeenLastCalledWith(4);
    expect(star(4)).toHaveAttribute('aria-checked', 'true');
    expect(star(4)).toHaveFocus();
    expect(star(4)).toHaveAttribute('tabindex', '0');

    await user.keyboard('{ArrowLeft}');
    expect(spy).toHaveBeenLastCalledWith(3);
    expect(star(3)).toHaveFocus();

    await user.keyboard('{End}');
    expect(spy).toHaveBeenLastCalledWith(5);
    expect(star(5)).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(spy).toHaveBeenCalledTimes(3); // clamped at max: no onChange for an unchanged value
    expect(star(5)).toHaveFocus();

    await user.keyboard('{Home}');
    expect(spy).toHaveBeenLastCalledWith(1);
    expect(star(1)).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(spy).toHaveBeenLastCalledWith(0);
    expect(checkedStars()).toHaveLength(0);
    expect(star(1)).toHaveAttribute('tabindex', '0');
    expect(star(1)).toHaveFocus();
  });

  it('steps by 0.5 with allowHalf and shows a half fill on the ceiling star', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<Harness initial={2} allowHalf spy={spy} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(spy).toHaveBeenLastCalledWith(2.5);
    expect(star(3)).toHaveAttribute('aria-checked', 'true');
    expect(star(3)).toHaveFocus();
    expect(fills()).toEqual(['full', 'full', 'half', 'empty', 'empty']);
    await user.keyboard('{Home}');
    expect(spy).toHaveBeenLastCalledWith(0.5);
    expect(fills()).toEqual(['half', 'empty', 'empty', 'empty', 'empty']);
  });
});

describe('5. half stars from pointer position', () => {
  let rectSpy: jest.SpyInstance;
  beforeEach(() => {
    rectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 20,
      right: 120,
      top: 0,
      bottom: 20,
      height: 20,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });
  afterEach(() => rectSpy.mockRestore());

  it('senior: left half of a star previews N - 0.5, right half previews N; click commits the half', () => {
    const onChange = jest.fn();
    render(<StarRating label="Review score" allowHalf onChange={onChange} />);

    fireEvent.mouseMove(star(3), { clientX: 104 });
    expect(group()).toHaveAttribute('data-preview', '2.5');
    expect(fills()).toEqual(['full', 'full', 'half', 'empty', 'empty']);

    fireEvent.mouseMove(star(3), { clientX: 116 });
    expect(group()).toHaveAttribute('data-preview', '3');
    expect(fills()).toEqual(['full', 'full', 'full', 'empty', 'empty']);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(star(3), { clientX: 104 });
    expect(onChange).toHaveBeenCalledWith(2.5);
    expect(star(3)).toHaveAttribute('aria-checked', 'true');
  });

  it('ignores the pointer position without allowHalf', () => {
    const onChange = jest.fn();
    render(<StarRating label="Review score" onChange={onChange} />);
    fireEvent.mouseMove(star(3), { clientX: 104 });
    expect(group()).toHaveAttribute('data-preview', '3');
    fireEvent.click(star(3), { clientX: 104 });
    expect(onChange).toHaveBeenCalledWith(3);
  });
});

describe('6. read-only', () => {
  it('senior: renders a single labelled img, no radios, and ignores clicks and keys', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<StarRating label="Review score" value={3.5} allowHalf readOnly onChange={onChange} />);
    const img = screen.getByRole('img', { name: 'Rated 3.5 of 5' });
    expect(img).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);

    await user.click(img);
    img.focus();
    await user.keyboard('{ArrowRight}{End}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Rated 3.5 of 5' })).toBeInTheDocument();
  });
});

describe('7. controlled and uncontrolled', () => {
  it('starts at defaultValue when uncontrolled', () => {
    render(<StarRating label="Review score" defaultValue={2} />);
    expect(star(2)).toHaveAttribute('aria-checked', 'true');
  });

  it('with value it only reports onChange and follows the prop', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { rerender } = render(<StarRating label="Review score" value={2} onChange={onChange} />);
    await user.click(star(5));
    expect(onChange).toHaveBeenCalledWith(5);
    expect(star(2)).toHaveAttribute('aria-checked', 'true');
    expect(star(5)).toHaveAttribute('aria-checked', 'false');

    rerender(<StarRating label="Review score" value={5} onChange={onChange} />);
    expect(star(5)).toHaveAttribute('aria-checked', 'true');
    expect(fills()).toEqual(['full', 'full', 'full', 'full', 'full']);
  });
});

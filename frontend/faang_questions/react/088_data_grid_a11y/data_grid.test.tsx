/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Column,
  DataGrid,
  Row,
  SortState,
  nextSortDirection,
  rangeBetween,
  sortRows,
} from './data_grid';

// jsdom 20 has no PointerEvent: a MouseEvent with a pointerId is enough for
// the resize handle (boundary shim, not a component mock).
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventShim extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEventShim }).PointerEvent = PointerEventShim;
}

const COLUMNS: Column[] = [
  { key: 'task', header: 'Task' },
  { key: 'annotator', header: 'Annotator', sortable: true },
  { key: 'confidence', header: 'Confidence', sortable: true },
  { key: 'status', header: 'Status' },
];

// Original order r1..r6. Sorted by confidence ascending: r3, r5, r2, r4, r1, r6.
const ROWS: Row[] = [
  { id: 'r1', task: 'Task 1', annotator: 'mina', confidence: 0.9, status: 'approved' },
  { id: 'r2', task: 'Task 2', annotator: 'ada', confidence: 0.4, status: 'pending' },
  { id: 'r3', task: 'Task 3', annotator: 'zoe', confidence: 0.1, status: 'pending' },
  { id: 'r4', task: 'Task 4', annotator: 'bob', confidence: 0.7, status: 'rejected' },
  { id: 'r5', task: 'Task 5', annotator: 'ada', confidence: 0.3, status: 'approved' },
  { id: 'r6', task: 'Task 6', annotator: 'kim', confidence: 0.95, status: 'pending' },
];

function Harness({
  initial = [],
  spy,
  pageSize = 4,
}: {
  initial?: string[];
  spy?: (next: Set<string>) => void;
  pageSize?: number;
}) {
  const [selection, setSelection] = useState<Set<string>>(() => new Set(initial));
  return (
    <DataGrid
      rows={ROWS}
      columns={COLUMNS}
      pageSize={pageSize}
      selection={selection}
      onSelectionChange={(next) => {
        spy?.(next);
        setSelection(next);
      }}
    />
  );
}

function setup(initial: string[] = []) {
  const spy = jest.fn();
  const user = userEvent.setup();
  render(<Harness initial={initial} spy={spy} />);
  return { spy, user };
}

const bodyRows = () =>
  screen.getAllByRole('row').filter((r) => within(r).queryAllByRole('gridcell').length > 0);
const rowIds = () =>
  bodyRows().map((r) => within(r).getByRole('checkbox').getAttribute('aria-label')!.replace('Select row ', ''));
const cellAt = (rowIndex: number, col: number) =>
  within(bodyRows()[rowIndex]).getAllByRole('gridcell')[col];
const tabbableCells = () => screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0);
const header = (text: string) => screen.getByRole('columnheader', { name: new RegExp(text) });
const sortButton = (text: string) => within(header(text)).getByRole('button', { name: text });
const handle = (text: string) => screen.getByRole('separator', { name: `Resize ${text} column` });
const checkbox = (id: string) => screen.getByRole('checkbox', { name: `Select row ${id}` });
const lastSelection = (spy: jest.Mock) =>
  [...(spy.mock.calls[spy.mock.calls.length - 1][0] as Set<string>)].sort();

describe('pure helpers', () => {
  it('nextSortDirection cycles none -> ascending -> descending -> none', () => {
    expect(nextSortDirection('none')).toBe('ascending');
    expect(nextSortDirection('ascending')).toBe('descending');
    expect(nextSortDirection('descending')).toBe('none');
  });

  it('sortRows sorts numbers numerically and strings alphabetically, in both directions', () => {
    const asc: SortState = { key: 'confidence', direction: 'ascending' };
    expect(sortRows(ROWS, asc).map((r) => r.id)).toEqual(['r3', 'r5', 'r2', 'r4', 'r1', 'r6']);
    const desc: SortState = { key: 'confidence', direction: 'descending' };
    expect(sortRows(ROWS, desc).map((r) => r.id)).toEqual(['r6', 'r1', 'r4', 'r2', 'r5', 'r3']);
    const byName: SortState = { key: 'annotator', direction: 'ascending' };
    expect(sortRows(ROWS, byName).map((r) => r.annotator)).toEqual([
      'ada',
      'ada',
      'bob',
      'kim',
      'mina',
      'zoe',
    ]);
  });

  it('sortRows is stable and returns the original order for null without mutating', () => {
    const byName: SortState = { key: 'annotator', direction: 'ascending' };
    expect(sortRows(ROWS, byName).slice(0, 2).map((r) => r.id)).toEqual(['r2', 'r5']);
    const copy = [...ROWS];
    expect(sortRows(ROWS, null).map((r) => r.id)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6']);
    expect(ROWS).toEqual(copy);
  });

  it('rangeBetween is inclusive, works backwards, and falls back to the target alone', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    expect(rangeBetween(ids, 'b', 'd')).toEqual(['b', 'c', 'd']);
    expect(rangeBetween(ids, 'd', 'b')).toEqual(['b', 'c', 'd']);
    expect(rangeBetween(ids, 'c', 'c')).toEqual(['c']);
    expect(rangeBetween(ids, 'zz', 'c')).toEqual(['c']);
  });
});

describe('1. sorting', () => {
  it('renders a grid with column headers and aria-sort only on sortable columns', () => {
    setup();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(header('Confidence')).toHaveAttribute('aria-sort', 'none');
    expect(header('Annotator')).toHaveAttribute('aria-sort', 'none');
    expect(header('Task')).not.toHaveAttribute('aria-sort');
    expect(within(header('Task')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('cycles ascending -> descending -> none and re-orders rows', async () => {
    const { user } = setup();
    expect(rowIds()).toEqual(['r1', 'r2', 'r3', 'r4']);

    await user.click(sortButton('Confidence'));
    expect(header('Confidence')).toHaveAttribute('aria-sort', 'ascending');
    expect(rowIds()).toEqual(['r3', 'r5', 'r2', 'r4']);

    await user.click(sortButton('Confidence'));
    expect(header('Confidence')).toHaveAttribute('aria-sort', 'descending');
    expect(rowIds()).toEqual(['r6', 'r1', 'r4', 'r2']);

    await user.click(sortButton('Confidence'));
    expect(header('Confidence')).toHaveAttribute('aria-sort', 'none');
    expect(rowIds()).toEqual(['r1', 'r2', 'r3', 'r4']);
  });

  it('sorts one column at a time', async () => {
    const { user } = setup();
    await user.click(sortButton('Confidence'));
    await user.click(sortButton('Annotator'));
    expect(header('Annotator')).toHaveAttribute('aria-sort', 'ascending');
    expect(header('Confidence')).toHaveAttribute('aria-sort', 'none');
    expect(rowIds()).toEqual(['r2', 'r5', 'r4', 'r6']);
  });
});

describe('2. column resize', () => {
  it('exposes a vertical separator per data column with the current width', () => {
    setup();
    const h = handle('Confidence');
    expect(h).toHaveAttribute('aria-orientation', 'vertical');
    expect(h).toHaveAttribute('aria-valuenow', '120');
    expect(h).toHaveAttribute('aria-valuemin', '40');
    expect(header('Confidence')).toHaveStyle({ width: '120px' });
  });

  it('ArrowRight / ArrowLeft change the width by 10px and never go below 40', async () => {
    const { user } = setup();
    const h = handle('Task');
    h.focus();
    await user.keyboard('{ArrowRight}');
    expect(h).toHaveAttribute('aria-valuenow', '130');
    expect(header('Task')).toHaveStyle({ width: '130px' });

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(h).toHaveAttribute('aria-valuenow', '110');
    expect(header('Task')).toHaveStyle({ width: '110px' });

    for (let i = 0; i < 12; i++) await user.keyboard('{ArrowLeft}');
    expect(h).toHaveAttribute('aria-valuenow', '40');
    expect(header('Task')).toHaveStyle({ width: '40px' });
    // Other columns are untouched.
    expect(handle('Confidence')).toHaveAttribute('aria-valuenow', '120');
  });

  it('pointer drag resizes by the horizontal delta and stops after pointerup', () => {
    setup();
    const h = handle('Annotator');
    fireEvent.pointerDown(h, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(h, { clientX: 250, pointerId: 1 });
    expect(h).toHaveAttribute('aria-valuenow', '170');
    expect(header('Annotator')).toHaveStyle({ width: '170px' });

    fireEvent.pointerMove(h, { clientX: 230, pointerId: 1 });
    expect(h).toHaveAttribute('aria-valuenow', '150');

    fireEvent.pointerUp(h, { clientX: 230, pointerId: 1 });
    fireEvent.pointerMove(h, { clientX: 400, pointerId: 1 });
    expect(h).toHaveAttribute('aria-valuenow', '150');
  });
});

describe('3. roving tabindex and arrow navigation', () => {
  it('has exactly one tabbable gridcell, initially the first cell of the first row', () => {
    setup();
    expect(tabbableCells()).toEqual([cellAt(0, 0)]);
  });

  it('arrow keys move the active cell and DOM focus, clamped at the edges', async () => {
    const { user } = setup();
    await user.click(cellAt(0, 1));
    expect(tabbableCells()).toEqual([cellAt(0, 1)]);

    await user.keyboard('{ArrowRight}');
    expect(cellAt(0, 2)).toHaveFocus();
    expect(tabbableCells()).toEqual([cellAt(0, 2)]);

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(cellAt(2, 2)).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(cellAt(2, 1)).toHaveFocus();

    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(cellAt(0, 1)).toHaveFocus();

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(cellAt(0, 4)).toHaveFocus();
    expect(tabbableCells()).toHaveLength(1);
  });

  it('Home / End jump to the first / last cell of the row', async () => {
    const { user } = setup();
    await user.click(cellAt(1, 2));
    await user.keyboard('{End}');
    expect(cellAt(1, 4)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cellAt(1, 0)).toHaveFocus();
  });

  it('PageDown / PageUp change the page and keep the row position and column', async () => {
    const { user } = setup();
    await user.click(cellAt(1, 2));
    await user.keyboard('{PageDown}');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(rowIds()).toEqual(['r5', 'r6']);
    expect(cellAt(1, 2)).toHaveFocus();
    expect(tabbableCells()).toEqual([cellAt(1, 2)]);

    await user.keyboard('{PageUp}');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(cellAt(1, 2)).toHaveFocus();
  });

  it('PageDown clamps the row position when the next page is shorter', async () => {
    const { user } = setup();
    await user.click(cellAt(3, 1));
    await user.keyboard('{PageDown}');
    expect(rowIds()).toEqual(['r5', 'r6']);
    expect(cellAt(1, 1)).toHaveFocus();
  });
});

describe('4. row selection', () => {
  it('clicking a row checkbox toggles that row by id', async () => {
    const { user, spy } = setup();
    await user.click(checkbox('r2'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(lastSelection(spy)).toEqual(['r2']);
    expect(checkbox('r2')).toBeChecked();
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');

    await user.click(checkbox('r2'));
    expect(lastSelection(spy)).toEqual([]);
    expect(checkbox('r2')).not.toBeChecked();
    expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('Space on the selection cell toggles the row', async () => {
    const { user, spy } = setup();
    await user.click(cellAt(0, 2));
    await user.keyboard('{Home}{ArrowDown}{ArrowDown} ');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(lastSelection(spy)).toEqual(['r3']);
    expect(checkbox('r3')).toBeChecked();
  });

  it('Space on a non-selection cell does not select', async () => {
    const { user, spy } = setup();
    await user.click(cellAt(0, 2));
    await user.keyboard(' ');
    expect(spy).not.toHaveBeenCalled();
  });

  it('Shift+click selects the inclusive range from the anchor and keeps prior selections', async () => {
    const { user, spy } = setup(['r6']);
    await user.click(checkbox('r1'));
    await user.keyboard('{Shift>}');
    await user.click(checkbox('r3'));
    await user.keyboard('{/Shift}');
    expect(lastSelection(spy)).toEqual(['r1', 'r2', 'r3', 'r6']);
    expect(screen.getByRole('status')).toHaveTextContent('4 selected');
  });

  it('Shift+click with no anchor behaves like a plain click', async () => {
    const { user, spy } = setup();
    await user.keyboard('{Shift>}');
    await user.click(checkbox('r4'));
    await user.keyboard('{/Shift}');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(lastSelection(spy)).toEqual(['r4']);
  });

  it('Space with focus on the checkbox itself toggles exactly once', async () => {
    const { user, spy } = setup();
    await user.click(checkbox('r1'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(checkbox('r1')).toBeChecked();
    checkbox('r1').focus();
    await user.keyboard(' ');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(lastSelection(spy)).toEqual([]);
    expect(checkbox('r1')).not.toBeChecked();
  });
});

describe('5. controlled selection', () => {
  it('never stores selection itself: without a parent update the checkbox stays unchecked', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    const { rerender } = render(
      <DataGrid
        rows={ROWS}
        columns={COLUMNS}
        pageSize={4}
        selection={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(checkbox('r1'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
    expect(checkbox('r1')).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('0 selected');

    rerender(
      <DataGrid
        rows={ROWS}
        columns={COLUMNS}
        pageSize={4}
        selection={new Set(['r1', 'r5'])}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(checkbox('r1')).toBeChecked();
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
  });

  it('passes a new Set instance and does not mutate the prop', async () => {
    const user = userEvent.setup();
    const selection = new Set(['r2']);
    const onSelectionChange = jest.fn();
    render(
      <DataGrid
        rows={ROWS}
        columns={COLUMNS}
        pageSize={4}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(checkbox('r3'));
    const next = onSelectionChange.mock.calls[0][0] as Set<string>;
    expect(next).not.toBe(selection);
    expect([...next].sort()).toEqual(['r2', 'r3']);
    expect([...selection]).toEqual(['r2']);
  });
});

describe('6. selection survives sorting and paging', () => {
  it('keeps selected ids checked after paging away and back', async () => {
    const { user } = setup();
    await user.click(checkbox('r2'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(rowIds()).toEqual(['r5', 'r6']);
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
    await user.click(checkbox('r6'));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(checkbox('r2')).toBeChecked();
    expect(checkbox('r1')).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
  });

  it('keeps selected ids checked after sorting moves them', async () => {
    const { user } = setup();
    await user.click(checkbox('r2'));
    await user.click(sortButton('Confidence'));
    expect(rowIds()).toEqual(['r3', 'r5', 'r2', 'r4']);
    expect(checkbox('r2')).toBeChecked();
    expect(bodyRows()[2]).toHaveAttribute('aria-selected', 'true');
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
  });
});

describe('7. paging', () => {
  it('renders page size rows, a page indicator, and disables buttons at the ends', async () => {
    const { user } = setup();
    expect(bodyRows()).toHaveLength(4);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('defaults to 10 rows per page', () => {
    render(
      <DataGrid rows={ROWS} columns={COLUMNS} selection={new Set()} onSelectionChange={() => {}} />,
    );
    expect(bodyRows()).toHaveLength(6);
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});

describe('senior', () => {
  it('Shift+click after sorting selects the displayed range, not the original id order', async () => {
    const { user, spy } = setup();
    await user.click(sortButton('Confidence'));
    expect(rowIds()).toEqual(['r3', 'r5', 'r2', 'r4']);

    await user.click(checkbox('r3'));
    await user.keyboard('{Shift>}');
    await user.click(checkbox('r4'));
    await user.keyboard('{/Shift}');

    // Displayed between r3 and r4: r5 and r2. Original-order r3..r4 would be just r3, r4.
    expect(lastSelection(spy)).toEqual(['r2', 'r3', 'r4', 'r5']);
    expect(checkbox('r5')).toBeChecked();
    expect(checkbox('r2')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('4 selected');
  });

  it('Shift+click range follows the current sort order across pages', async () => {
    const { user, spy } = setup();
    await user.click(sortButton('Confidence'));
    await user.click(checkbox('r2')); // sorted index 2
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(rowIds()).toEqual(['r1', 'r6']);
    await user.keyboard('{Shift>}');
    await user.click(checkbox('r6')); // sorted index 5
    await user.keyboard('{/Shift}');
    expect(lastSelection(spy)).toEqual(['r1', 'r2', 'r4', 'r6']);
  });

  it('the active cell stays on the same row id (and column) after sorting', async () => {
    const { user } = setup();
    await user.click(within(bodyRows()[1]).getByText('Task 2')); // r2, Task column
    expect(tabbableCells()).toEqual([cellAt(1, 1)]);

    await user.click(sortButton('Confidence'));
    expect(rowIds()).toEqual(['r3', 'r5', 'r2', 'r4']);

    const [active] = tabbableCells();
    expect(tabbableCells()).toHaveLength(1);
    expect(active).toHaveTextContent('Task 2');
    expect(within(active.closest('[role="row"]') as HTMLElement).getByRole('checkbox')).toHaveAccessibleName(
      'Select row r2',
    );

    // Keyboard continues from there: ArrowDown lands on r4's Task cell.
    active.focus();
    await user.keyboard('{ArrowDown}');
    expect(cellAt(3, 1)).toHaveFocus();
    expect(cellAt(3, 1)).toHaveTextContent('Task 4');
  });

  it('falls back to the first row (same column) when the active row leaves the page', async () => {
    const { user } = setup();
    await user.click(within(bodyRows()[0]).getByText('Task 1')); // r1, Task column
    await user.click(sortButton('Confidence'));
    expect(rowIds()).toEqual(['r3', 'r5', 'r2', 'r4']); // r1 is now on page 2
    expect(tabbableCells()).toEqual([cellAt(0, 1)]);
    expect(cellAt(0, 1)).toHaveTextContent('Task 3');
  });
});

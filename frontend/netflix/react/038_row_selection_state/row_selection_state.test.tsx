/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Row,
  SelectableTable,
  getHeaderState,
  initialSelectionState,
  selectionReducer,
} from './row_selection_state';

describe('selectionReducer', () => {
  it('toggleRow selects and deselects a row', () => {
    let state = selectionReducer(initialSelectionState, { type: 'toggleRow', id: 'a' });
    expect([...state.selectedIds]).toEqual(['a']);
    state = selectionReducer(state, { type: 'toggleRow', id: 'a' });
    expect(state.selectedIds.size).toBe(0);
  });

  it('togglePage selects all visible ids when any are unselected', () => {
    let state = selectionReducer(initialSelectionState, { type: 'toggleRow', id: 'a' });
    state = selectionReducer(state, { type: 'togglePage', pageIds: ['a', 'b', 'c'] });
    expect([...state.selectedIds].sort()).toEqual(['a', 'b', 'c']);
  });

  it('togglePage deselects only the visible ids when all are selected', () => {
    let state = selectionReducer(initialSelectionState, {
      type: 'selectAll',
      allIds: ['a', 'b', 'c', 'd'],
    });
    state = selectionReducer(state, { type: 'togglePage', pageIds: ['a', 'b'] });
    expect([...state.selectedIds].sort()).toEqual(['c', 'd']);
  });

  it('selectAll selects across all pages, clearAll empties', () => {
    let state = selectionReducer(initialSelectionState, {
      type: 'selectAll',
      allIds: ['a', 'b', 'c', 'd', 'e'],
    });
    expect(state.selectedIds.size).toBe(5);
    state = selectionReducer(state, { type: 'clearAll' });
    expect(state.selectedIds.size).toBe(0);
  });

  it('never mutates the previous Set', () => {
    const before = initialSelectionState;
    selectionReducer(before, { type: 'toggleRow', id: 'a' });
    expect(before.selectedIds.size).toBe(0);
  });

  it('getHeaderState reports all / some / none', () => {
    const selected = new Set(['a', 'b']);
    expect(getHeaderState(selected, ['a', 'b'])).toBe('all');
    expect(getHeaderState(selected, ['a', 'c'])).toBe('some');
    expect(getHeaderState(selected, ['c', 'd'])).toBe('none');
    expect(getHeaderState(selected, [])).toBe('none');
  });
});

describe('SelectableTable', () => {
  const rows: Row[] = [
    { id: 'r1', name: 'Encode alpha' },
    { id: 'r2', name: 'Encode beta' },
    { id: 'r3', name: 'Encode gamma' },
    { id: 'r4', name: 'Encode delta' },
    { id: 'r5', name: 'Encode epsilon' },
  ];

  const header = () => screen.getByRole('checkbox', { name: 'Select page' }) as HTMLInputElement;

  it('header checkbox selects the whole page, then clears it', async () => {
    const user = userEvent.setup();
    render(<SelectableTable rows={rows} pageSize={3} />);
    await user.click(header());
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Encode alpha' })).toBeChecked();
    expect(header()).toBeChecked();
    await user.click(header());
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(header()).not.toBeChecked();
  });

  it('header checkbox is indeterminate when the page is partially selected', async () => {
    const user = userEvent.setup();
    render(<SelectableTable rows={rows} pageSize={3} />);
    expect(header().indeterminate).toBe(false);
    await user.click(screen.getByRole('checkbox', { name: 'Encode beta' }));
    expect(header().indeterminate).toBe(true);
    expect(header()).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Encode alpha' }));
    await user.click(screen.getByRole('checkbox', { name: 'Encode gamma' }));
    expect(header().indeterminate).toBe(false);
    expect(header()).toBeChecked();
  });

  it('selection survives paging away and back', async () => {
    const user = userEvent.setup();
    render(<SelectableTable rows={rows} pageSize={3} />);
    await user.click(screen.getByRole('checkbox', { name: 'Encode alpha' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('checkbox', { name: 'Encode alpha' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Encode beta' })).not.toBeChecked();
  });

  it('select-page only touches the visible page; select-all covers every page', async () => {
    const user = userEvent.setup();
    render(<SelectableTable rows={rows} pageSize={3} />);
    await user.click(header());
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Select all 5' }));
    expect(screen.getByText('5 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('checkbox', { name: 'Encode delta' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Encode epsilon' })).toBeChecked();
  });

  it('deselecting a full page keeps selections on other pages', async () => {
    const user = userEvent.setup();
    render(<SelectableTable rows={rows} pageSize={3} />);
    await user.click(screen.getByRole('button', { name: 'Select all 5' }));
    await user.click(header()); // page 1 fully selected -> deselect page 1 only
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('checkbox', { name: 'Encode delta' })).toBeChecked();
  });

  it('clear empties the selection everywhere', async () => {
    const user = userEvent.setup();
    render(<SelectableTable rows={rows} pageSize={3} />);
    await user.click(screen.getByRole('button', { name: 'Select all 5' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(header()).not.toBeChecked();
    expect(header().indeterminate).toBe(false);
  });
});

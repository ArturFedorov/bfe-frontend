/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_FILTERS,
  FilterBar,
  FilterState,
  createInitialFilterState,
  filterReducer,
} from './filter_reducer';

describe('filterReducer', () => {
  it('creates initial state from the built-in defaults', () => {
    const state = createInitialFilterState();
    expect(state.status).toBe(DEFAULT_FILTERS.status);
    expect(state.region).toBe(DEFAULT_FILTERS.region);
    expect(state.search).toBe(DEFAULT_FILTERS.search);
    expect(state.defaults).toEqual(DEFAULT_FILTERS);
  });

  it('setStatus updates only the status', () => {
    const state = createInitialFilterState();
    const next = filterReducer(state, { type: 'setStatus', status: 'active' });
    expect(next.status).toBe('active');
    expect(next.region).toBe(state.region);
    expect(next.search).toBe(state.search);
  });

  it('setRegion updates only the region', () => {
    const state = createInitialFilterState();
    const next = filterReducer(state, { type: 'setRegion', region: 'emea' });
    expect(next.region).toBe('emea');
    expect(next.status).toBe(state.status);
    expect(next.search).toBe(state.search);
  });

  it('setSearch updates only the search text', () => {
    const state = createInitialFilterState();
    const next = filterReducer(state, { type: 'setSearch', search: 'acme' });
    expect(next.search).toBe('acme');
    expect(next.status).toBe(state.status);
    expect(next.region).toBe(state.region);
  });

  it('does not mutate the previous state', () => {
    const state = createInitialFilterState();
    filterReducer(state, { type: 'setSearch', search: 'acme' });
    expect(state.search).toBe('');
  });

  it('clearAll resets to the built-in defaults', () => {
    let state = createInitialFilterState();
    state = filterReducer(state, { type: 'setStatus', status: 'paused' });
    state = filterReducer(state, { type: 'setSearch', search: 'acme' });
    const cleared = filterReducer(state, { type: 'clearAll' });
    expect(cleared.status).toBe('all');
    expect(cleared.region).toBe('all');
    expect(cleared.search).toBe('');
  });

  it('clearAll preserves custom defaults instead of the built-ins', () => {
    const defaults = { status: 'active', region: 'emea', search: '' };
    let state: FilterState = createInitialFilterState(defaults);
    state = filterReducer(state, { type: 'setStatus', status: 'paused' });
    state = filterReducer(state, { type: 'setRegion', region: 'apac' });
    state = filterReducer(state, { type: 'setSearch', search: 'acme' });
    const cleared = filterReducer(state, { type: 'clearAll' });
    expect(cleared.status).toBe('active');
    expect(cleared.region).toBe('emea');
    expect(cleared.search).toBe('');
    expect(cleared.defaults).toEqual(defaults);
  });
});

describe('FilterBar', () => {
  it('renders controls with default values', () => {
    render(<FilterBar />);
    expect(screen.getByLabelText('Status')).toHaveValue('all');
    expect(screen.getByLabelText('Region')).toHaveValue('all');
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });

  it('updates each filter from user input', async () => {
    const user = userEvent.setup();
    render(<FilterBar />);
    await user.selectOptions(screen.getByLabelText('Status'), 'active');
    await user.selectOptions(screen.getByLabelText('Region'), 'emea');
    await user.type(screen.getByLabelText('Search'), 'acme');
    expect(screen.getByLabelText('Status')).toHaveValue('active');
    expect(screen.getByLabelText('Region')).toHaveValue('emea');
    expect(screen.getByLabelText('Search')).toHaveValue('acme');
  });

  it('clear all resets every control back to its defaults', async () => {
    const user = userEvent.setup();
    render(
      <FilterBar defaults={{ status: 'active', region: 'emea', search: '' }} />,
    );
    await user.selectOptions(screen.getByLabelText('Status'), 'paused');
    await user.selectOptions(screen.getByLabelText('Region'), 'apac');
    await user.type(screen.getByLabelText('Search'), 'acme');
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByLabelText('Status')).toHaveValue('active');
    expect(screen.getByLabelText('Region')).toHaveValue('emea');
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });
});

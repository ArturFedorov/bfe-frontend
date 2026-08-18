/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartnerAutocomplete, Partner } from './partner_autocomplete';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const netflix: Partner = { id: 'p1', name: 'Netflix Originals' };
const nordic: Partner = { id: 'p2', name: 'Nordic Films' };
const neon: Partner = { id: 'p3', name: 'Neon Studios' };

interface RecordedCall {
  query: string;
  signal: AbortSignal | undefined;
  d: ReturnType<typeof deferred<Partner[]>>;
}

function setup() {
  const calls: RecordedCall[] = [];
  const fetchPartners = jest.fn(
    (query: string, opts?: { signal?: AbortSignal }) => {
      const d = deferred<Partner[]>();
      calls.push({ query, signal: opts?.signal, d });
      return d.promise;
    }
  );
  const onSelect = jest.fn();
  render(
    <PartnerAutocomplete
      fetchPartners={fetchPartners}
      onSelect={onSelect}
      debounceMs={300}
    />
  );
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const combobox = () => screen.getByRole('combobox', { name: 'Partner' });
  return { calls, fetchPartners, onSelect, user, combobox };
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

async function resolveCall(call: RecordedCall, partners: Partner[]) {
  await act(async () => {
    call.d.resolve(partners);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PartnerAutocomplete', () => {
  it('debounces typing: no fetch until debounceMs of silence', async () => {
    const { user, combobox, fetchPartners, calls } = setup();

    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveAttribute('aria-autocomplete', 'list');

    await user.type(combobox(), 'net');
    expect(fetchPartners).not.toHaveBeenCalled();

    advance(299);
    expect(fetchPartners).not.toHaveBeenCalled();

    advance(1);
    expect(fetchPartners).toHaveBeenCalledTimes(1);
    expect(calls[0].query).toBe('net');
    expect(calls[0].signal).toBeInstanceOf(AbortSignal);
  });

  it('collapses rapid keystrokes into one fetch with the final query', async () => {
    const { user, combobox, fetchPartners, calls } = setup();

    await user.type(combobox(), 'ne');
    advance(150);
    await user.type(combobox(), 't');
    advance(299);
    expect(fetchPartners).not.toHaveBeenCalled();

    advance(1);
    expect(fetchPartners).toHaveBeenCalledTimes(1);
    expect(calls[0].query).toBe('net');
  });

  it('renders combobox results with listbox roles and highlighted match', async () => {
    const { user, combobox, calls } = setup();

    await user.type(combobox(), 'net');
    advance(300);
    await resolveCall(calls[0], [netflix]);

    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(combobox()).toHaveAttribute('aria-controls', listbox.id);

    const option = screen.getByRole('option', { name: 'Netflix Originals' });
    const mark = option.querySelector('mark');
    expect(mark).not.toBeNull();
    expect(mark).toHaveTextContent('Net'); // case-insensitive match wrapped
  });

  it('aborts the previous request and ignores its stale resolution', async () => {
    const { user, combobox, calls, fetchPartners } = setup();

    await user.type(combobox(), 'ne');
    advance(300);
    expect(fetchPartners).toHaveBeenCalledTimes(1);

    await user.type(combobox(), 't');
    advance(300);
    expect(fetchPartners).toHaveBeenCalledTimes(2);
    expect(calls[0].signal?.aborted).toBe(true);
    expect(calls[1].signal?.aborted).toBe(false);

    await resolveCall(calls[1], [netflix]);
    expect(screen.getAllByRole('option')).toHaveLength(1);

    // stale first response settles late — it must not overwrite
    await resolveCall(calls[0], [nordic, neon]);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Netflix Originals');
  });

  it('clearing the input closes the popup, aborts, and drops the late response', async () => {
    const { user, combobox, calls, fetchPartners } = setup();

    await user.type(combobox(), 'ne');
    advance(300);
    expect(fetchPartners).toHaveBeenCalledTimes(1);

    await user.clear(combobox());
    expect(calls[0].signal?.aborted).toBe(true);
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');

    await resolveCall(calls[0], [netflix, nordic]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    advance(1000);
    expect(fetchPartners).toHaveBeenCalledTimes(1);
  });

  it('shows an announced empty state and keeps the popup closed', async () => {
    const { user, combobox, calls } = setup();

    await user.type(combobox(), 'zzz');
    advance(300);
    await resolveCall(calls[0], []);

    expect(screen.getByRole('status')).toHaveTextContent('No partners found');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves the active option with ArrowDown/ArrowUp, wrapping at both ends', async () => {
    const { user, combobox, calls } = setup();

    await user.type(combobox(), 'n');
    advance(300);
    await resolveCall(calls[0], [netflix, nordic, neon]);

    // no active option until the first ArrowDown
    expect(combobox()).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('{ArrowDown}');
    const first = screen.getByRole('option', { name: 'Netflix Originals' });
    expect(combobox()).toHaveAttribute('aria-activedescendant', first.id);
    expect(first).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    const second = screen.getByRole('option', { name: 'Nordic Films' });
    expect(combobox()).toHaveAttribute('aria-activedescendant', second.id);
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{ArrowUp}');
    expect(combobox()).toHaveAttribute('aria-activedescendant', first.id);

    // ArrowUp from the first option wraps to the last
    await user.keyboard('{ArrowUp}');
    const last = screen.getByRole('option', { name: 'Neon Studios' });
    expect(combobox()).toHaveAttribute('aria-activedescendant', last.id);

    // ArrowDown from the last option wraps to the first
    await user.keyboard('{ArrowDown}');
    expect(combobox()).toHaveAttribute('aria-activedescendant', first.id);
  });

  it('selects the active option with Enter', async () => {
    const { user, combobox, calls, onSelect, fetchPartners } = setup();

    await user.type(combobox(), 'n');
    advance(300);
    await resolveCall(calls[0], [netflix, nordic, neon]);

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(nordic);
    expect(combobox()).toHaveValue('Nordic Films');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // selection must not schedule another fetch
    advance(1000);
    expect(fetchPartners).toHaveBeenCalledTimes(1);
  });

  it('does nothing on Enter when no option is active', async () => {
    const { user, combobox, calls, onSelect } = setup();

    await user.type(combobox(), 'n');
    advance(300);
    await resolveCall(calls[0], [netflix, nordic]);

    await user.keyboard('{Enter}');

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes the popup on Escape and keeps the typed text', async () => {
    const { user, combobox, calls, onSelect } = setup();

    await user.type(combobox(), 'n');
    advance(300);
    await resolveCall(calls[0], [netflix, nordic]);

    await user.keyboard('{Escape}');

    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox()).toHaveValue('n');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('selects an option on click', async () => {
    const { user, combobox, calls, onSelect } = setup();

    await user.type(combobox(), 'n');
    advance(300);
    await resolveCall(calls[0], [netflix, nordic]);

    await user.click(screen.getByRole('option', { name: 'Nordic Films' }));

    expect(onSelect).toHaveBeenCalledWith(nordic);
    expect(combobox()).toHaveValue('Nordic Films');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });
});

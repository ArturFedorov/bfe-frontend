/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncStatesPanel, AsyncResult, Partner } from './async_states_panel';

const partners: Partner[] = [
  { id: 'p1', name: 'Acme Studios' },
  { id: 'p2', name: 'Nordic Films' },
];

describe('AsyncStatesPanel', () => {
  it('renders only the loading skeleton in the loading state', () => {
    render(
      <AsyncStatesPanel result={{ status: 'loading' }} onRetry={jest.fn()} />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading partners…');
    // impossible-state combos must not render
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('No partners found')).not.toBeInTheDocument();
  });

  it('renders only the announced error and a retry button in the error state', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <AsyncStatesPanel
        result={{ status: 'error', error: new Error('Upstream timeout') }}
        onRetry={onRetry}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Upstream timeout');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    // impossible-state combos must not render
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('No partners found')).not.toBeInTheDocument();
  });

  it('renders the empty state when success has no rows', () => {
    render(
      <AsyncStatesPanel
        result={{ status: 'success', data: [] }}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText('No partners found')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders partner names as a semantic list in the success state', () => {
    render(
      <AsyncStatesPanel
        result={{ status: 'success', data: partners }}
        onRetry={jest.fn()}
      />
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Acme Studios');
    expect(items[1]).toHaveTextContent('Nordic Films');
    // impossible-state combos must not render
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('makes impossible state combinations unrepresentable in the type', () => {
    // @ts-expect-error loading cannot carry data
    const bad1: AsyncResult<Partner> = { status: 'loading', data: partners };
    // @ts-expect-error error cannot carry data
    const bad2: AsyncResult<Partner> = { status: 'error', error: new Error('x'), data: partners };
    // @ts-expect-error success cannot carry an error
    const bad3: AsyncResult<Partner> = { status: 'success', data: partners, error: new Error('x') };
    const good: AsyncResult<Partner> = { status: 'success', data: partners };
    expect([bad1, bad2, bad3, good]).toBeDefined();
  });
});

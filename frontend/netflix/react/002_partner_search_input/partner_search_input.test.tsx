/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartnerSearchInput } from './partner_search_input';
import type { PartnerSearchInputProps } from './partner_search_input';

function Harness(props: Partial<PartnerSearchInputProps>) {
  const [value, setValue] = useState(props.value ?? '');
  return <PartnerSearchInput {...props} value={value} onChange={setValue} />;
}

describe('PartnerSearchInput', () => {
  it('renders a labeled searchbox with the default label', () => {
    render(<Harness />);
    expect(screen.getByRole('searchbox', { name: 'Search partners' })).toBeInTheDocument();
  });

  it('supports a custom label and maxLength', () => {
    render(<Harness label="Filter deliveries" maxLength={20} />);
    const input = screen.getByRole('searchbox', { name: 'Filter deliveries' });
    expect(input).toHaveAttribute('maxlength', '20');
    expect(screen.getByText('0 / 20')).toBeInTheDocument();
  });

  it('reflects typing through the parent and updates the counter', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Search partners' });
    await user.type(input, 'acme');
    expect(input).toHaveValue('acme');
    expect(screen.getByText('4 / 50')).toBeInTheDocument();
  });

  it('hides the clear button when empty and shows it once there is a value', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search partners' }), 'a');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears the value via the clear button', async () => {
    const user = userEvent.setup();
    render(<Harness value="netflix" />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    const input = screen.getByRole('searchbox', { name: 'Search partners' });
    expect(input).toHaveValue('');
    expect(screen.getByText('0 / 50')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('is fully controlled: display never drifts from the value prop', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<PartnerSearchInput value="locked" onChange={onChange} />);
    const input = screen.getByRole('searchbox', { name: 'Search partners' });
    await user.type(input, 'x');
    expect(onChange).toHaveBeenCalledWith('lockedx');
    expect(input).toHaveValue('locked');
  });

  it('reports the clear intent through onChange rather than mutating itself', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<PartnerSearchInput value="locked" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.getByRole('searchbox', { name: 'Search partners' })).toHaveValue('locked');
  });
});

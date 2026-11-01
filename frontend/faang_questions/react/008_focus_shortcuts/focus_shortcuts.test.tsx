/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartnerAccessForm } from './focus_shortcuts';

describe('PartnerAccessForm', () => {
  it('renders all labeled fields and the submit button', () => {
    render(<PartnerAccessForm onSubmit={jest.fn()} />);
    expect(screen.getByRole('searchbox', { name: 'Search partners' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Partner ID' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Contact email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grant access' })).toBeInTheDocument();
  });

  it('pressing / outside a text field focuses search without typing a slash', async () => {
    const user = userEvent.setup();
    render(<PartnerAccessForm onSubmit={jest.fn()} />);
    await user.keyboard('/');
    const search = screen.getByRole('searchbox', { name: 'Search partners' });
    expect(search).toHaveFocus();
    expect(search).toHaveValue('');
  });

  it('pressing / inside another text field types a literal slash and keeps focus', async () => {
    const user = userEvent.setup();
    render(<PartnerAccessForm onSubmit={jest.fn()} />);
    const partnerId = screen.getByRole('textbox', { name: 'Partner ID' });
    await user.click(partnerId);
    await user.keyboard('acme/emea');
    expect(partnerId).toHaveFocus();
    expect(partnerId).toHaveValue('acme/emea');
    expect(screen.getByRole('searchbox', { name: 'Search partners' })).not.toHaveFocus();
  });

  it('Escape clears the search input and blurs it', async () => {
    const user = userEvent.setup();
    render(<PartnerAccessForm onSubmit={jest.fn()} />);
    const search = screen.getByRole('searchbox', { name: 'Search partners' });
    await user.click(search);
    await user.keyboard('pixelworks');
    expect(search).toHaveValue('pixelworks');
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(search).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('failed submit with empty Partner ID focuses it and marks it invalid', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PartnerAccessForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Grant access' }));
    const partnerId = screen.getByRole('textbox', { name: 'Partner ID' });
    expect(partnerId).toHaveFocus();
    expect(partnerId).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('failed submit with a bad email focuses the email field', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PartnerAccessForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox', { name: 'Partner ID' }), 'acme-001');
    await user.type(screen.getByRole('textbox', { name: 'Contact email' }), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Grant access' }));
    const email = screen.getByRole('textbox', { name: 'Contact email' });
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Partner ID' })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('valid submit calls onSubmit once with the values and clears invalid marks', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<PartnerAccessForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Grant access' }));
    await user.type(screen.getByRole('textbox', { name: 'Partner ID' }), 'acme-001');
    await user.type(screen.getByRole('textbox', { name: 'Contact email' }), 'ops@acme.example');
    await user.click(screen.getByRole('button', { name: 'Grant access' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      partnerId: 'acme-001',
      contactEmail: 'ops@acme.example',
    });
    expect(screen.getByRole('textbox', { name: 'Partner ID' })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('textbox', { name: 'Contact email' })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});

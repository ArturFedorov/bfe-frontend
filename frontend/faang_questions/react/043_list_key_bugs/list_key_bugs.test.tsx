/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TitleList } from './list_key_bugs';

function visibleOrder(): string[] {
  return screen.getAllByRole('listitem').map(
    (li) => within(li).getByText(/^(Alpha|Bravo|Charlie)$/).textContent as string
  );
}

describe('043 list key bugs — behavior that already works', () => {
  it('renders the three titles in order', () => {
    render(<TitleList />);
    expect(visibleOrder()).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('move down swaps the row order', async () => {
    const user = userEvent.setup();
    render(<TitleList />);
    await user.click(screen.getByRole('button', { name: 'Move Alpha down' }));
    expect(visibleOrder()).toEqual(['Bravo', 'Alpha', 'Charlie']);
  });

  it('move down on the last row is a no-op', async () => {
    const user = userEvent.setup();
    render(<TitleList />);
    await user.click(screen.getByRole('button', { name: 'Move Charlie down' }));
    expect(visibleOrder()).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
});

describe('043 list key bugs — state follows the item (fail until fixed)', () => {
  it('a typed note MOVES with its row on reorder', async () => {
    const user = userEvent.setup();
    render(<TitleList />);

    await user.type(screen.getByLabelText('Note for Alpha'), 'audio drops at 12:03');
    await user.click(screen.getByRole('button', { name: 'Move Alpha down' }));

    expect(visibleOrder()).toEqual(['Bravo', 'Alpha', 'Charlie']);
    // The note must still belong to Alpha …
    expect(screen.getByLabelText('Note for Alpha')).toHaveValue('audio drops at 12:03');
    // … and must NOT have been left behind on the row now occupying slot 0.
    expect(screen.getByLabelText('Note for Bravo')).toHaveValue('');
  });

  it('two notes survive two reorders without swapping owners', async () => {
    const user = userEvent.setup();
    render(<TitleList />);

    await user.type(screen.getByLabelText('Note for Alpha'), 'note A');
    await user.type(screen.getByLabelText('Note for Bravo'), 'note B');

    await user.click(screen.getByRole('button', { name: 'Move Alpha down' })); // B A C
    await user.click(screen.getByRole('button', { name: 'Move Alpha down' })); // B C A

    expect(visibleOrder()).toEqual(['Bravo', 'Charlie', 'Alpha']);
    expect(screen.getByLabelText('Note for Alpha')).toHaveValue('note A');
    expect(screen.getByLabelText('Note for Bravo')).toHaveValue('note B');
    expect(screen.getByLabelText('Note for Charlie')).toHaveValue('');
  });
});

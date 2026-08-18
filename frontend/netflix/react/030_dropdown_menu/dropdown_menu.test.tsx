/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu, DropdownMenuItem } from './dropdown_menu';

const items: DropdownMenuItem[] = [
  { id: 'retry', label: 'Retry delivery' },
  { id: 'manifest', label: 'View manifest' },
  { id: 'archive', label: 'Archive', disabled: true },
];

function renderMenu(onSelect = jest.fn()) {
  render(
    <div>
      <DropdownMenu label="Actions" items={items} onSelect={onSelect} />
      <button>Elsewhere</button>
    </div>,
  );
  return onSelect;
}

describe('030 DropdownMenu', () => {
  it('renders a closed trigger with menu button semantics', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on trigger click, focuses the first enabled item, and closes on second click', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(
      screen.getByRole('menuitem', { name: 'Retry delivery' }),
    ).toHaveFocus();

    await user.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps menu items out of the Tab order and marks disabled items', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item).toHaveAttribute('tabindex', '-1');
    }
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('navigates with ArrowDown/ArrowUp, wrapping and skipping disabled items', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));

    await user.keyboard('{ArrowDown}');
    expect(
      screen.getByRole('menuitem', { name: 'View manifest' }),
    ).toHaveFocus();

    // next is Archive (disabled) -> skip and wrap to the first item
    await user.keyboard('{ArrowDown}');
    expect(
      screen.getByRole('menuitem', { name: 'Retry delivery' }),
    ).toHaveFocus();

    // ArrowUp wraps backwards, also skipping Archive
    await user.keyboard('{ArrowUp}');
    expect(
      screen.getByRole('menuitem', { name: 'View manifest' }),
    ).toHaveFocus();
  });

  it('selects with Enter, calls onSelect with the id, and closes', async () => {
    const user = userEvent.setup();
    const onSelect = renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('manifest');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('selects with a click on an enabled item, but never on a disabled one', async () => {
    const user = userEvent.setup();
    const onSelect = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Retry delivery' }));
    expect(onSelect).toHaveBeenCalledWith('retry');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on an outside pointer press, but not on presses inside the menu', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));

    await user.click(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    expect(
      screen.getByRole('menuitem', { name: 'Retry delivery' }),
    ).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

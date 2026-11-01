/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './theme_context';

function ThemeBadge() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Theme: {theme}</button>;
}

function ThemeLabel() {
  const { theme } = useTheme();
  return <p>current: {theme}</p>;
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('throws a helpful error when used outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeBadge />)).toThrow(/useTheme.*ThemeProvider/);
    consoleError.mockRestore();
  });

  it('defaults to light when nothing is stored', () => {
    render(
      <ThemeProvider>
        <ThemeBadge />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Theme: light' })).toBeInTheDocument();
  });

  it('honors an explicit defaultTheme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeBadge />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Theme: dark' })).toBeInTheDocument();
  });

  it('initializes from a persisted theme, beating defaultTheme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeBadge />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Theme: dark' })).toBeInTheDocument();
  });

  it('ignores garbage in storage and falls back to the default', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'solarized');
    render(
      <ThemeProvider>
        <ThemeBadge />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Theme: light' })).toBeInTheDocument();
  });

  it('toggling updates every consumer under the provider', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeBadge />
        <ThemeLabel />
      </ThemeProvider>,
    );
    expect(screen.getByText('current: light')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Theme: light' }));
    expect(screen.getByRole('button', { name: 'Theme: dark' })).toBeInTheDocument();
    expect(screen.getByText('current: dark')).toBeInTheDocument();
  });

  it('persists theme changes to localStorage', async () => {
    const user = userEvent.setup();
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    render(
      <ThemeProvider>
        <ThemeBadge />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Theme: light' }));
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    setItem.mockRestore();
  });

  it('toggling twice returns to the original theme', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeBadge />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Theme: dark' }));
    await user.click(screen.getByRole('button', { name: 'Theme: light' }));
    expect(screen.getByRole('button', { name: 'Theme: dark' })).toBeInTheDocument();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});

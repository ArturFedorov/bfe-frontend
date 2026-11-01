import { ThemeProvider, useTheme } from './theme_context';

/**
 * Demo harness for the theme context — auto-discovered by the playground
 * (playground/App.tsx). The consumers below are demo-only; the task is
 * ThemeProvider/useTheme in theme_context.tsx.
 */

function ThemedPanel() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <div
      style={{
        background: dark ? '#111827' : '#ffffff',
        color: dark ? '#f9fafb' : '#1f2937',
        border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
        borderRadius: 8,
        padding: '1rem 1.25rem',
      }}
    >
      <p style={{ marginTop: 0 }}>
        Current theme: <strong>{theme}</strong> — persisted to localStorage under{' '}
        <code>partner-ops-theme</code>, so it survives a page reload.
      </p>
      <div className="demo-controls">
        <button onClick={toggleTheme}>Toggle theme</button>
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
      </div>
    </div>
  );
}

function ThemeBadge() {
  const { theme } = useTheme();
  return (
    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
      A second consumer under the same provider sees: <strong>{theme}</strong>
    </p>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>Theme Context</h2>
      <p className="demo-note">
        Implement <code>ThemeProvider</code> and <code>useTheme</code> in{' '}
        <code>theme_context.tsx</code> — lazy localStorage init, persistence on every change, and
        a loud error when the hook is used outside the provider. Toggling from the panel must
        update the badge below it too.
      </p>
      <div className="demo-stage">
        <ThemeProvider defaultTheme="light">
          <ThemedPanel />
          <ThemeBadge />
        </ThemeProvider>
      </div>
    </div>
  );
}

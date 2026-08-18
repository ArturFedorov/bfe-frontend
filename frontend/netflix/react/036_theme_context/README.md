# 036. Theme Context

Difficulty: Medium

Topics: context, custom hooks, localStorage persistence

## Scenario

The Partner Operations suite is a handful of micro-frontends that all need to
respect the operator's light/dark preference. Prop-drilling `theme` through
twelve layout components is off the table. Build a `ThemeProvider` and a
`useTheme()` hook that any component can call — and make misuse loud: calling the
hook outside the provider must throw a message that tells the developer exactly
what to fix, not a cryptic null dereference. The chosen theme persists to
`localStorage` (the same mechanism as your 011 persistence hook) so it survives a
reload.

## Acceptance Criteria

- `ThemeProvider({ children, defaultTheme? })` owns the theme state
  (`'light' | 'dark'`, default `'light'`).
- On mount it initializes from `localStorage` under `THEME_STORAGE_KEY`; a stored
  valid theme wins over `defaultTheme`; garbage or missing values fall back to
  `defaultTheme`.
- Every theme change is written back to `localStorage`.
- `useTheme()` returns `{ theme, setTheme, toggleTheme }`.
- Calling `useTheme()` outside a provider throws an `Error` whose message names
  the hook and the missing provider (e.g. mentions `ThemeProvider`).
- Toggling from any consumer updates all consumers under the same provider.

## Example

```tsx
function ThemeBadge() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Theme: {theme}</button>;
}

<ThemeProvider defaultTheme="dark">
  <ThemeBadge />
</ThemeProvider>;
```

## Target

- One context, `null` sentinel, guard lives in the hook — components never
  null-check.
- Lazy `useState` initializer for the localStorage read (no flash, no effect race).
- ~45 lines.

## Interviewer follow-up

- Why throw in the hook instead of returning a default value silently?
- Where would `localStorage` reads break during SSR, and how would you guard them?
- The context value is a fresh object each render — when does that matter, and how
  would you stabilize it?

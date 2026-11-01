import { ReactElement, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'partner-ops-theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps): ReactElement {
  // TODO: implement — lazy-init from localStorage (valid stored theme beats
  // defaultTheme), persist every change back under THEME_STORAGE_KEY.
  throw new Error('Not implemented');
}

export function useTheme(): ThemeContextValue {
  // TODO: implement — throw a helpful error naming ThemeProvider when called
  // outside of one.
  throw new Error('Not implemented');
}

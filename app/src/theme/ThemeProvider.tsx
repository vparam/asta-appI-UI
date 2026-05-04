import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTokens, Mode, Tokens } from './tokens';

type ThemeCtx = { tokens: Tokens; mode: Mode };

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: Mode = scheme === 'dark' ? 'dark' : 'light';
  const value = useMemo(() => ({ tokens: getTokens(mode), mode }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTokens(): Tokens {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTokens must be used inside ThemeProvider');
  return ctx.tokens;
}

export function useMode(): Mode {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useMode must be used inside ThemeProvider');
  return ctx.mode;
}

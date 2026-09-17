'use client';
import React, { createContext, useContext, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import LightTheme from './LightTheme';
import DarkTheme from './DarkTheme';

const ThemeContext = createContext({ mode: 'light', toggleMode: () => {} });
export const useUABTheme = () => useContext(ThemeContext);

export default function UABThemeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDark ? 'dark' : 'light');
  const toggleMode = () => setMode(m => (m === 'light' ? 'dark' : 'light'));
  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={mode === 'dark' ? DarkTheme : LightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

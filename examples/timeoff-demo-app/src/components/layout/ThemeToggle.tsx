'use client';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useUABTheme } from '@/theme/ThemeProvider';

// Light/dark toggle for the AppBar. The bar itself stays UAB Green in both
// modes; only the page content below changes.
export default function ThemeToggle() {
  const { mode, toggleMode } = useUABTheme();
  return (
    <IconButton
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleMode}
      sx={{ color: '#fff' }}
      size="small"
    >
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

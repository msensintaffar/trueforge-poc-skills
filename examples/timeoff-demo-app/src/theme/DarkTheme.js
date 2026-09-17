/*
 * UAB OFFICIAL BRAND PALETTE (dark mode)
 * Generated from the UAB Brand Guide (bundled official values):
 * https://www.uab.edu/brandguide/university/colors
 *
 * PRIMARY
 *   UAB Green            #1A5632   Pantone 357
 *   UAB Gold             #FDB913   Pantone 7549
 *
 * SECONDARY ACCENTS
 *   Dragon's Lair Green  #033319   Pantone 5535
 *   Campus Green         #90D408   Pantone 376
 *   Ever Loyal Evergreen #17B045   Pantone 2257
 *   Bham Sky Blue        #42CAF0   Pantone 2198
 *
 * Full brand guide:  https://www.uab.edu/brandguide/university/colors
 * Fonts:             https://www.uab.edu/brandguide/university/fonts
 * Logo assets:       https://digitalassets.uab.edu (requires UAB login)
 * Accessibility:     WCAG 2.1 AA
 *
 * FONTS (Adobe Creative Cloud — requires UAB Adobe subscription)
 *   Primary (body/UI): proxima-nova, fallback: Arial / Aptos
 *   Heading:           kulturista-web, fallback: Rockwell
 */

import { createTheme } from '@mui/material/styles';

// Same Adobe Creative Cloud brand fonts as light mode — see LightTheme.js.
const fontStack =
  '"proxima-nova", Arial, Aptos, "Helvetica Neue", Helvetica, sans-serif';
const headingFontStack =
  '"kulturista-web", Rockwell, "proxima-nova", Arial, sans-serif';

const DarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1A5632', // UAB Green — the AppBar background never changes with the theme
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FDB913', // UAB Gold
      contrastText: '#033319',
    },
    success: {
      main: '#90D408', // Campus Green reads better on dark backgrounds
    },
    info: {
      main: '#42CAF0',
    },
    background: {
      default: '#022b1a',
      paper: '#1A5632',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: fontStack,
    h1: { fontFamily: headingFontStack },
    h2: { fontFamily: headingFontStack },
    h3: { fontFamily: headingFontStack },
    h4: { fontFamily: headingFontStack },
    h5: { fontFamily: headingFontStack },
    h6: { fontFamily: headingFontStack },
    button: { textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // WCAG 2.1 AA: visible focus rings on all interactive elements.
        '*:focus-visible': {
          outline: '3px solid #ffffff',
          outlineOffset: '2px',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});

export default DarkTheme;

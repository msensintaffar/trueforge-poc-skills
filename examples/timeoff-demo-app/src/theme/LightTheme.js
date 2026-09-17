/*
 * UAB OFFICIAL BRAND PALETTE
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

// UAB brand fonts are Adobe Creative Cloud fonts (kulturista-web for
// headings, proxima-nova for body/UI). They load via a Typekit embed in
// src/app/layout.tsx (TODO marked there); until that embed is added the
// app falls back to the system sans-serif stack below.
const fontStack =
  '"proxima-nova", Arial, Aptos, "Helvetica Neue", Helvetica, sans-serif';
const headingFontStack =
  '"kulturista-web", Rockwell, "proxima-nova", Arial, sans-serif';

const LightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A5632', // UAB Green
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FDB913', // UAB Gold
      contrastText: '#033319', // Dragon's Lair Green on gold — readable pairing
    },
    success: {
      main: '#17B045', // Ever Loyal Evergreen
    },
    info: {
      main: '#42CAF0', // Bham Sky Blue
    },
    background: {
      default: '#F2F2F3',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
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
          outline: '3px solid #033319',
          outlineOffset: '2px',
        },
        // WCAG: respect users who turn off animations at the OS level.
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

export default LightTheme;

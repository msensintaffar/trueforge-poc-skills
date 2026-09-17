'use client';
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useOptionalAuth } from './useOptionalAuth';

// Full-screen sign-in gate for this staff-only app: nothing — no nav, no
// page content — renders before a signed-in user is confirmed. Sits inside
// AuthProviderWrapper and UABThemeProvider so the splash is themed.
export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();

  // !auth || auth.isLoading MUST be checked before !auth.user — otherwise
  // every fresh page load flashes this splash for a frame while
  // react-oidc-context is still processing the redirect-back from Hydra.
  if (!auth || auth.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Checking your sign-in status…</Typography>
      </Box>
    );
  }

  if (!auth.user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Container maxWidth="xs" sx={{ textAlign: 'center' }}>
          {/* TODO: Replace with the official UAB Core logo (white) from
              https://digitalassets.uab.edu (requires UAB login) inside a
              UAB Green panel for contrast, per the brand guide's clear-space
              rules. The generic wordmark below is a placeholder. */}
          <Box
            sx={{
              mx: 'auto',
              mb: 3,
              px: 3,
              py: 2,
              display: 'inline-block',
              backgroundColor: 'primary.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="h5" component="div" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 1 }}>
              UAB
            </Typography>
          </Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Time-Off Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in with your UAB BlazerID to continue.
          </Typography>
          <Button variant="contained" size="large" onClick={() => auth.signinRedirect()}>
            Sign in with BlazerID
          </Button>
        </Container>
      </Box>
    );
  }

  return <>{children}</>;
}

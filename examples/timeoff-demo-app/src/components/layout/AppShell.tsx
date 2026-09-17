'use client';
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import { useOptionalAuth } from '@/auth/useOptionalAuth';

// This app is staff-only, so AppShell always renders already signed in
// (inside AuthGate) — the control shown is Sign out.
//
// Navigation: the app has five distinct sections, so it gets a sidebar
// (MUI Drawer) on desktop and a hamburger menu on mobile. The Drawer and
// the content area are flex SIBLINGS so the browser pushes content aside
// automatically — no hand-computed offset that can drift out of sync.

const drawerWidth = 260;

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Submit a Request', href: '/submit' },
  { label: 'My Requests', href: '/my-requests' },
  { label: 'Approvals', href: '/approvals' },
  { label: 'Balances', href: '/balances' },
  { label: 'Yearly Calendar', href: '/calendar' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const auth = useOptionalAuth();

  const user = auth?.user;
  const displayName =
    user?.profile?.name || user?.profile?.preferred_username || 'Signed in';

  const navContent = (
    <List>
      {NAV_ITEMS.map(item => {
        const selected = pathname === item.href;
        return (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={selected}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

  const handleDrawerToggle = () => setMobileOpen(o => !o);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ backgroundColor: 'primary.main', zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', gap: 2 }}>
          {isDesktop ? null : (
            <IconButton
              aria-label="Open navigation menu"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: '#fff' }}
              size="small"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Link href="/" aria-label="Time-Off Tracker home" style={{ display: 'block', lineHeight: 0 }}>
            {/* Plain <img>, not next/image: its fixed width/height props
                are easy to set to a ratio that doesn't match the real file,
                which squishes the logo. maxWidth with height auto preserves
                the real proportions. */}
            <img
              src="/uab-logo-white.png"
              alt="UAB"
              style={{ maxWidth: 270, height: 'auto', display: 'block' }}
            />
          </Link>
          <Typography
            variant="h6"
            noWrap
            sx={{ color: '#fff', display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}
          >
            Time-Off Tracker
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <ThemeToggle />
          {user ? (
            <Button
              onClick={() => auth?.signoutRedirect({ post_logout_redirect_uri: '' })}
              sx={{ color: '#fff' }}
            >
              Sign out
            </Button>
          ) : null}
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                position: 'static', // stays in flex flow — no overlap
              },
            }}
          >
            {navContent}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
          >
            {navContent}
          </Drawer>
        )}
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, p: 3 }}>{children}</Box>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}

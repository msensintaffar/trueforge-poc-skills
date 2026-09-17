import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import UABThemeProvider from '@/theme/ThemeProvider';
import AuthProviderWrapper from '@/auth/AuthProviderWrapper';
import AuthGate from '@/auth/AuthGate';
import AppShell from '@/components/layout/AppShell';

export const metadata = {
  title: 'Time-Off Tracker | UAB',
  description: 'Submit and track time-off requests at UAB.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* TODO: Add your Adobe Typekit embed code here for kulturista-web
            and proxima-nova fonts. Without it, the UAB brand fonts will not
            load and the app will fall back to system sans-serif. */}
        <AppRouterCacheProvider>
          <AuthProviderWrapper>
            <UABThemeProvider>
              <AuthGate>
                <AppShell>{children}</AppShell>
              </AuthGate>
            </UABThemeProvider>
          </AuthProviderWrapper>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

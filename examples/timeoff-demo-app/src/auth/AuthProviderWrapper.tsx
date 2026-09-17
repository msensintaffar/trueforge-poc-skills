'use client';
import { useEffect, type ReactNode } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { oidcConfig } from './oidcConfig';

// oidcConfig.ts's onSigninCallback only fires after a SUCCESSFUL
// signinCallback() — react-oidc-context throws before that callback ever
// runs when Hydra redirects back with ?error=... instead of ?code=...,
// which would otherwise leave the spent ?error=&state= params sitting in
// the address bar. This effect is the other half of that URL cleanup, for
// the failure path.
function AuthErrorUrlCleanup() {
  const auth = useAuth();
  useEffect(() => {
    if (auth.error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [auth.error]);
  return null;
}

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider {...oidcConfig}>
      <AuthErrorUrlCleanup />
      {children}
    </AuthProvider>
  );
}

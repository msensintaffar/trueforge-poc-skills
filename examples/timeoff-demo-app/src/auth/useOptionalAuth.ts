'use client';
import { useContext } from 'react';
import { AuthContext } from 'react-oidc-context';

// Single, consistent import path for auth state across the whole app.
// Never import react-oidc-context's own useAuth() directly anywhere.
export function useOptionalAuth() {
  return useContext(AuthContext);
}

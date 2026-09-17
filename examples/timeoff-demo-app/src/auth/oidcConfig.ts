// Ory Hydra OIDC configuration for UAB BlazerID single sign-on.
// react-oidc-context passes this object straight through to
// oidc-client-ts's UserManager, so field names follow oidc-client-ts's
// convention (snake_case for actual OIDC wire params, camelCase for
// library behavior flags).
export const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_AUTH_URL,
  client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
  redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URL,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: false,
  // Hydra appends ?code=...&scope=...&state=... to the redirect URI on the
  // way back from a SUCCESSFUL login. onSigninCallback fires right after
  // react-oidc-context's AuthProvider processes that — strip the params via
  // history.replaceState (not a navigation — the app is already mounted and
  // signed in at this point, so there's nothing to reload). This does NOT
  // fire on a failed/?error=... redirect back from Hydra — that's handled
  // separately in AuthProviderWrapper.tsx.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

// Central config loader. Nothing here is secret: the login values are
// plain identity-server addresses and client IDs, and data storage needs
// no configuration at all (local file, created automatically).
// If this app is later deployed somewhere permanent and gets a hosted
// database, that swap happens in src/lib/db.ts — see the note there.

export function getAppConfig() {
  return {
    appName: process.env.APP_NAME || 'timeoff-demo-app',
    appEnv: process.env.APP_ENV || 'development',
  };
}

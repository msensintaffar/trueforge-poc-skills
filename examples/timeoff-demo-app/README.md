# Time-Off Tracker (timeoff-demo-app)

## What this app does
Employees submit time-off requests for vacation, sick time, and personal
holidays, and managers approve or deny them. The app keeps track of how
much time off each person has earned and used, and shows everyone's
approved time off on a shared yearly calendar.

## Running this locally
1. Install dependencies: `npm install`
2. `.env.local` is already generated (gitignored, not included in the
   handoff zip) with everything that can be filled in locally. The login
   values are already real and working — no setup needed. Data storage
   works with nothing to configure — it saves to a local file
   automatically (see below).
3. Run it: `npm run dev`
4. Open http://localhost:3000 — you'll land on the sign-in screen first.
5. Health check: http://localhost:3000/api/health

## Where this app stores its data
This app saves its data to a local SQLite database file inside the
project folder (`.data/local.db`), created automatically the first time
the app runs. Nothing needs to be installed or configured for this to
work. If this app is later moved to a shared server so multiple people
can use it at once, that local storage should be replaced with a real
hosted database — that's a follow-up step for a developer, not something
this file walks through.

On first run the app also creates a small set of clearly-labeled demo
people and requests (names like "Dana (demo)") so the approvals screen
and the calendar aren't empty while you look around. You can delete
those rows from the requests and people tables at any time; the app will
not recreate them once you've signed in as yourself.

## Signing in
This app uses UAB's Ory Hydra single sign-on (BlazerID). Locally,
sign-in already works with no setup — `.env.local` ships with real,
working values pointed at UAB's identity server. If this app is later
deployed somewhere permanent, whoever deploys it needs to register
`timeoff-demo-app` as a new client with UAB's Ory Hydra OAuth2 server for
that deployment's URL, and set `NEXT_PUBLIC_AUTH_URL`,
`NEXT_PUBLIC_CLIENT_ID`, and `NEXT_PUBLIC_REDIRECT_URL` to that
environment's values (these are build-time values baked into the browser
bundle when the app is built — see `.env.template`).

Note on this demo build: the identity fields travel from the signed-in
browser to the app's own endpoints so the app runs locally with no extra
setup. A production deployment would verify the Hydra access token on
the server side instead — a step for whoever deploys it.

No separate post-logout redirect URI needs to be registered — signing
out intentionally lands the user on Hydra's own logged-out page rather
than bouncing back into the app (same behavior as UAB's other production
apps). Every page requires signing in first — there is no public
homepage to preview before logging in.

## Managers
The first-run demo data marks the "Steven" account as a manager so the
Approvals screen is reachable. To make yourself a manager (or promote a
teammate), open the local database file `.data/local.db` with any SQLite
browser and set `is_manager = 1` on that person's row — or ask whoever
maintains the app to do it.

## Deploying this app somewhere permanent
This generator hands off working, verified source code — it does not set
up Azure infrastructure, a deployment pipeline, or any hosting. Getting
this app running somewhere everyone can reach it (Azure, another cloud,
an on-premises server) is a separate step for a developer or your IT
team, who can containerize it (a Dockerfile is included) or deploy it
using their own standard process.

## Fonts
This app uses the UAB brand fonts `kulturista-web` and `proxima-nova`
via Adobe Typekit. Add your organization's Typekit embed `<script>` tag
to the `<head>` in `src/app/layout.tsx` — the TODO comment marks the
exact location. Without it the app still works but will use system
fonts instead.

## Who to contact about this project
Steven — still@uab.edu — IT

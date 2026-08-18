# Trip Wallet — MVP

Trip Wallet is a small Next.js + Supabase application for storing travel bookings and confirmation documents.

## Submission links

- Live application: [trip-wallet-seven.vercel.app](https://trip-wallet-seven.vercel.app)
- Source repository: [github.com/noamkrausfederr/TripWallet](https://github.com/noamkrausfederr/TripWallet)
- Assignment documents: [submission index](docs/submission.md)

This README covers local setup, running tests, and deployment steps.

Prerequisites

- Node.js 18+ and npm
- A Supabase account/project
- A Vercel account (for deployment)

Environment variables

Create a `.env.local` file (do NOT commit) with these variables. See `.env.example` for a template.

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable key (public in browser)
- `SUPABASE_SECRET_KEY` — Supabase secret key (server only, keep secret)
- `GEOAPIFY_API_KEY` — Geoapify server key for destination/address autocomplete (server only)

Local setup

1. Copy `.env.example` to `.env.local` and fill the values.

```bash
cp .env.example .env.local
# edit .env.local and paste your Supabase values
```

2. Install dependencies

```bash
npm install
```

3. Configure Supabase auth redirect URL

- In your Supabase project settings under Authentication → Settings → Redirect URLs, add:
  - `http://localhost:3000/auth/callback`

4. Create Supabase schema

- Open your Supabase project, go to "SQL Editor", and run the SQL file `supabase/schema.sql` from this repo. This creates tables, indexes and RLS policies used by the app.

4. The schema also creates the private `documents` storage bucket and its owner-only policies for uploaded tickets/confirmations.

5. Run the dev server

```bash
npm run dev
# open http://localhost:3000
```

Running tests

```bash
npm run test
npm run lint
npm run build
```

API endpoints added

- `POST /api/docs/signed-url` : return short-lived signed URL for a document (requires Authorization bearer token).
- `POST /api/docs/delete` : delete a single document (server-side, uses the server `SUPABASE_SECRET_KEY`).
- `POST /api/docs/cleanup-by-booking` : delete all documents for a booking and remove storage objects (server-side, uses the server `SUPABASE_SECRET_KEY`).

Notes and security

- Keep `SUPABASE_SECRET_KEY` secret — only set it in Vercel env settings (or other server env). The frontend uses only the publishable key plus Supabase RLS policies.
- The storage bucket `documents` must be private. Files are accessed via short-lived signed URLs created by server endpoints.

Deployment to Vercel

1. Create a new Vercel project and connect your GitHub repository.
2. In Vercel project settings, add the environment variables (use the same names as `.env.local`):
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
	- `SUPABASE_SECRET_KEY` (mark as secret; server-only)
	- `GEOAPIFY_API_KEY` (mark as secret; server-only)
3. Deploy. Vercel will run `npm install` and `npm run build`.

Further documentation

See [docs/submission.md](docs/submission.md) for the product specification, technical plan, test specification, security and scale documents, presentation outline, and manual verification checklist.

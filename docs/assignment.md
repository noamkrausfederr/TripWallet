# Trip Wallet — Assignment Documentation

This document summarizes the product, technical design, tests, security, scalability considerations, and local run instructions. It matches the current implementation.

## Product specification

- Name: Trip Wallet
- Purpose: A minimal digital wallet to store trip bookings and confirmations (flights, accommodation, transport, activities, restaurants, other).
- Core flows:
  - User signs up / signs in (Supabase magic link).
  - User creates trips (name, autocomplete destination, start/end date).
  - User creates bookings for a trip (title, type, date, time, required autocomplete address, optional confirmation number, notes, optional uploaded document).
  - Uploaded documents (PDF/JPG/PNG) are stored in Supabase Storage private bucket and accessible via short-lived signed URLs.
  - Bookings are shown chronologically on the trip page.

## Technical design

- Frontend: Next.js + TypeScript.
- Backend: Supabase (Postgres + Auth + Storage). Server-side API routes in Next.js are used only for operations requiring server privileges (signed URLs, storage deletes).
- Authentication: Supabase Auth (magic link email). Frontend uses the publishable key and relies on Row-Level Security (RLS) policies for data protection.
- Storage: Private Supabase Storage bucket `documents`. Files stored at `documents/{user_id}/{booking_id}/{filename}`.
- Address search: Geoapify autocomplete is called through a Next.js API route so its key remains server-only.
- Database schema: see `supabase/schema.sql` — tables: `profiles`, `trips`, `bookings`, `booking_documents`. RLS policies restrict rows to `auth.uid() = user_id`.

### Notable implementation choices

- Keep most CRUD operations on the frontend using the Supabase publishable key + RLS — simplicity for an educational assignment. Server APIs use the server secret key only where necessary (signed URLs, storage cleanup).
- One uploaded document per booking is supported (recorded in `booking_documents`), which keeps UX and DB simple.

## API endpoints (Next.js serverless)

- `POST /api/docs/signed-url` — input: `{ documentId }` (Authorization: Bearer <access_token>); verifies owner and returns a signed URL.
- `POST /api/docs/delete` — input: `{ documentId }` (Authorization: Bearer <access_token>); verifies owner then deletes storage object and DB row.
- `POST /api/docs/cleanup-by-booking` — input: `{ bookingId }` (Authorization: Bearer <access_token>); verifies booking owner then deletes all document files and DB rows for that booking.

## Test specification

- Unit tests (Vitest):
  - `test/trip-validation.test.ts` — trip date validation and booking chronological sort.
  - `test/file-validation.test.ts` — file type and size validations.
- API handler tests (mocked Supabase):
  - `test/docs-api.test.ts` — ensure endpoints require authorization.
  - `test/authorization.test.ts` — verify server endpoints deny access when a requester does not own the resource.
- UI tests (React Testing Library + Vitest and mocking):
  - `test/booking-ui.test.tsx` — create booking with upload, view ticket via signed URL, delete document.
  - `test/booking-upload-invalid.test.tsx` — oversized file upload results in an error message.

Testing approach: tests mock Supabase clients to validate server-side ownership checks and client behaviors without requiring a live Supabase instance. This keeps tests fast and simple for a student assignment.

## Basic scalability

### Current state
- Database indexes: `trips.user_id`, `bookings.trip_id`, `bookings.user_id`, and `bookings.booking_date` are created. These support efficient reads for a user's trips and chronological booking sorting.
- UI loads all bookings for a trip without pagination; suitable for typical travel scenarios (10-50 bookings per trip).
- Storage: files are stored under `documents/{user_id}/{booking_id}/` paths for efficient lifecycle management.

### Scaling scenarios
- **10s–100s of users**: current architecture handles easily. No bottlenecks.
- **100s–1000s of users**: Supabase Postgres can handle this. Database queries remain fast with indexes in place.
- **1000s–10k users**: Pagination becomes necessary. Implement cursor-based pagination on the bookings list to load 10–20 items per page, reducing payload and improving responsiveness.

### Identified scaling limitations and improvements
1. **No pagination**: If a user creates hundreds of bookings, fetching all at once becomes slow. **Fix**: Implement server-side paginated queries with cursor/offset and limit parameters (e.g., `limit=20, offset=0`).
2. **Storage I/O**: Supabase Storage is serverless and scales automatically, but signed URL generation could be cached client-side briefly (with expiry) to reduce API calls.
3. **Document metadata**: Currently only filename is stored. Larger-scale app might add file size, mime type, upload date indexes to support filtering and sorting in UI.
4. **No data archive**: Over time, old trips accumulate. Implement soft-delete (mark trips as archived) and only fetch active trips in the default view.
5. **RLS policy complexity**: as more user roles and sharing features are added, RLS policies can become expensive. Use `EXPLAIN ANALYZE` to profile slow queries and add specialized indexes or materialized views.

### Future optimization checklist
- [ ] Add pagination to bookings list (cursor-based or offset/limit).
- [ ] Cache signed URLs briefly on client (5–10 min) to reduce API round-trips.
- [ ] Profile database queries with `EXPLAIN ANALYZE` under high load.
- [ ] Add archival/soft-delete for old trips.
- [ ] Consider read replicas if analytics or reporting is added.
- [ ] Monitor Supabase Storage bandwidth and file count limits.

## Basic security

### Authentication & authorization
- **User identity**: Supabase Auth manages user registration and sign-in via magic link (email). No passwords stored; email verification is implicit.
- **Session tokens**: On sign-in, Supabase issues a JWT access token (valid ~1 hour by default). Frontend stores it in local storage and sends it with every request via `Authorization: Bearer <token>` header.
- **Row-level security (RLS)**: All data tables (`profiles`, `trips`, `bookings`, `booking_documents`) have RLS policies enforcing `auth.uid() = user_id`. Users cannot query or modify other users' rows, even with a valid token.
- **Server-side verification**: API endpoints (`/api/docs/signed-url`, `/api/docs/delete`, `/api/docs/cleanup-by-booking`) verify the requester's ownership before performing any action, using the Supabase service role key on the server.

### Data storage & access
- **Database**: data is stored in Supabase Postgres. All communication uses TLS. Sensitive keys are never exposed in the frontend.
- **Storage bucket**: the `documents` bucket is **private**. Files are not accessible via direct URL. Access is controlled via Supabase Storage policies (owner-only) and short-lived signed URLs (valid ~60 seconds).
- **Secrets**: `SUPABASE_SECRET_KEY` and `GEOAPIFY_API_KEY` are stored only on the server (Vercel environment variables, marked as secret). They are never sent to the browser.

### Input validation & error handling
- **File uploads**: validated on frontend (max 5 MB, allowed types: PDF, JPG, PNG) and re-validated on server before storage.
- **Date inputs**: bookings' `booking_date` is validated to be within the trip's date range (server-side query check).
- **API errors**: errors are caught and logged; sensitive details (e.g., database errors) are not exposed to the client.

### Known security considerations & future improvements
1. **Magic link expiry**: Magic link tokens expire after a short time (default ~15 min). Longer-lived links increase attack surface.
2. **CORS**: Currently allows requests from any origin (for simplicity in dev). Production deployment should restrict CORS to the deployed domain.
3. **Rate limiting**: Not implemented. High-volume attackers could brute-force sign-in or upload endpoints. **Fix**: Add rate limiting on authentication endpoints (Supabase or middleware) and file upload size/frequency limits.
4. **CSRF protection**: Next.js provides built-in CSRF protection for form submissions, but API calls via fetch require custom CSRF tokens for extra safety. **Fix**: Implement CSRF token validation on state-changing API endpoints.
5. **SQL injection**: Supabase parameterizes queries, so direct SQL injection is not possible. However, always use prepared statements in custom server code.
6. **XSS (Cross-Site Scripting)**: React auto-escapes values by default. User-generated content (e.g., notes, titles) is safe. **Fix**: Never use `dangerouslySetInnerHTML` without sanitization.
7. **Dependency vulnerabilities**: Run `npm audit` regularly and update packages. Several devDependencies have known vulnerabilities.
8. **Audit logging**: Not implemented. A production app should log sensitive actions (file uploads, deletions, trips created/deleted) for compliance and debugging. **Fix**: Add audit table and log all user actions server-side.

### Security checklist for deployment
- [ ] Set `SUPABASE_SECRET_KEY` and `GEOAPIFY_API_KEY` in Vercel dashboard (mark as secret).
- [ ] Verify Supabase Auth redirect URLs include only the deployed domain.
- [ ] Test that unauthenticated requests to API endpoints fail.
- [ ] Test RLS policies: logged-in user cannot access another user's data.
- [ ] Enable HTTPS on the deployed domain (Vercel provides this by default).
- [ ] Review and restrict CORS policy for production.
- [ ] Run `npm audit` and fix or document known vulnerabilities.
- [ ] Set up email notifications for Supabase Auth and Storage events (suspicious activity).

## Local run instructions (summary)

1. Copy `.env.example` to `.env.local` and set the env vars.
2. Run `npm install`.
3. Run SQL in `supabase/schema.sql` in your Supabase project SQL editor.
4. The schema creates the private `documents` storage bucket and owner-only policies.
5. Run `npm run dev` and open `http://localhost:3000`.

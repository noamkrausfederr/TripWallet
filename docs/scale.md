# Basic Scale Plan

## Current suitability

The MVP is suitable for tens to hundreds of users and typical trips with tens of bookings. Supabase manages connection pooling, authentication, Postgres, and object storage; Vercel runs stateless application/API instances.

## Current safeguards

- Indexes support the common owner-trip, trip-booking, and chronological booking queries.
- Documents are organized by user and booking path, so their lifecycle is easy to manage.
- Privileged work is limited to short API routes; normal CRUD uses Supabase plus RLS.
- Signed URLs expire after 60 seconds, avoiding permanently public files.

## Limits and future work

The trip page currently loads all bookings for one trip. For a user with hundreds or thousands of bookings, add cursor-based pagination and fetch only the fields used by each view. Cache signed URLs briefly on the client, add archived trips, profile Postgres queries with `EXPLAIN ANALYZE`, and monitor storage bandwidth/object counts. Sharing, analytics, and role-based access would require additional indexes and careful RLS profiling.

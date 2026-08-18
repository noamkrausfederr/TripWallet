# Basic Security Plan

## Authentication and authorization

Supabase Auth uses email magic links. The browser uses only the Supabase publishable key. Row-Level Security limits `profiles`, `trips`, `bookings`, and `booking_documents` to `auth.uid() = user_id`.

The signed URL, document delete, and booking cleanup routes require an `Authorization: Bearer` token. Each route validates the token, confirms the requester owns the target row, and only then uses the server-only Supabase secret key.

## Data and secret protection

- The `documents` storage bucket is private.
- Storage policies allow users to access only their own folder.
- File access is granted through 60-second signed URLs.
- `SUPABASE_SECRET_KEY` and `GEOAPIFY_API_KEY` are server environment variables only. They must never use the `NEXT_PUBLIC_` prefix.
- Geoapify requests are proxied by a server API route.

## Validation

Trip forms require name, destination, and valid date order. Booking forms require title, date, and address; booking dates must lie within the parent trip’s dates. Uploads are restricted to PDF/JPG/PNG and 5 MB on the client before a booking is created. Storage paths use sanitized filenames.

## Remaining risks and improvements

The MVP does not yet include rate limiting, audit logs, virus scanning, automated end-to-end tests against a live Supabase project, or database-level enforcement of the cross-table booking-date rule. A production extension should add those controls, restrict production origins as needed, and regularly run dependency audits. The current dependency audit command is `npm audit --omit=dev --audit-level=high`.

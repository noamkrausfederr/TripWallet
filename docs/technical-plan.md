# Technical Plan and Architecture

## Architecture

```
Browser (Next.js + React + TypeScript)
  ├─ Supabase Auth, Postgres, and Storage via publishable key + RLS
  └─ Next.js API routes for signed URLs and storage cleanup
        └─ Supabase service-role client (server only)
```

Supabase Postgres stores application data, Supabase Auth identifies the user, and a private Supabase Storage bucket stores uploaded documents. Vercel hosts the Next.js application and API routes. Geoapify is called only by the server-side autocomplete route so its API key is not sent to the browser.

## Project structure

```
src/
  components/AddressAutocomplete.tsx     reusable address/destination input
  lib/                                   Supabase, document API, and validation helpers
  pages/                                 Next.js pages and API routes
    api/docs/                            privileged document operations
    trips/                               trip and booking screens
  styles/globals.css
supabase/schema.sql                      tables, indexes, RLS, storage policies
test/                                    Vitest unit, UI, and API authorization tests
docs/                                    submission documentation
```

## Pages and components

| Route | Responsibility |
|---|---|
| `/` | Product landing page and contact link |
| `/auth`, `/auth/callback` | Magic-link sign-in and callback exchange |
| `/trips`, `/trips/new`, `/trips/[id]` | List, create, and view trips |
| `/trips/[id]/bookings/new` | Create a booking and optional document |
| `/trips/[id]/bookings/[bid]` | View booking details and documents |
| `/trips/[id]/bookings/[bid]/edit` | Update or delete a booking |
| `/api/address-autocomplete` | Proxy Geoapify autocomplete |
| `/api/docs/*` | Authenticated signed URL, document delete, and booking document cleanup |

`AddressAutocomplete` owns suggestion state, keyboard navigation, and request cancellation. Page components own their local form, loading, success, and error state; no global client state is required for this MVP.

## Data model

| Entity | Important fields | Relationship |
|---|---|---|
| `profiles` | `id`, `email` | one profile per Auth user |
| `trips` | `user_id`, `name`, `destination`, `start_date`, `end_date` | one user has many trips |
| `bookings` | `trip_id`, `user_id`, `title`, `type`, `booking_date`, `address` | one trip has many bookings |
| `booking_documents` | `booking_id`, `user_id`, `file_name`, `storage_path`, `file_type` | a booking can have zero or more documents |

`trips.user_id`, `bookings.trip_id`, `bookings.user_id`, and `bookings.booking_date` are indexed. Foreign keys cascade when a parent row is deleted. `supabase/schema.sql` defines RLS policies for all application tables and the private `documents` bucket.

## CRUD and business rules

- Trips: create and list through the Supabase client; RLS limits all rows to the signed-in owner.
- Bookings: create, read, update, and delete through the Supabase client. The booking date must be inside the parent trip date range, and title, date, and address are required.
- Documents: files are uploaded under `{userId}/{bookingId}/{safeFilename}`. PDF/JPG/PNG files up to 5 MB are accepted. The creation flow validates before inserting a booking and rolls the booking back if upload or metadata creation fails.
- Sensitive document operations use API routes. Each route verifies the bearer token and ownership before the service-role client accesses storage.

## Error and UX design

All forms show clear inline errors and disable the primary action while a request is in progress. Empty states explain the next action. Booking timelines sort by date then time. Document links use short-lived signed URLs rather than public storage URLs.

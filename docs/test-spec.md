# Test Specification

## Goal

The test strategy verifies that the product’s core customer journeys work, invalid input is rejected, and one user cannot access another user’s data.

## Automated coverage

| Area | Cases |
|---|---|
| Trip and booking dates | Booking dates inside/equal to trip bounds are accepted; dates outside the range are rejected; chronological sort is verified. |
| File validation | PDF/JPG/PNG under 5 MB are accepted; unsupported types and oversize files are rejected; storage filenames are sanitized. |
| Document APIs | Missing authorization is rejected; an authenticated non-owner receives forbidden for signed URL, deletion, and cleanup actions. |
| Booking UI | A booking form accepts valid data and upload; an oversized file displays an error; booking details open a signed URL; no-document empty state renders; an attached document can be deleted from the UI. |

Run automated checks with:

```bash
npm run lint
npm test
npm run build
```

## Manual and integration checks before submission

| Scenario | Expected result |
|---|---|
| Magic-link sign-in | A valid link reaches `/trips`; an invalid/expired callback shows a clear error. |
| Trip CRUD path | A traveler can create a trip and see it in the list. |
| Booking validation | A booking outside the trip dates is refused; title/date/address are required. |
| Document lifecycle | Upload a permitted file, view it through a signed URL, delete it, and confirm its metadata and storage object disappear. |
| Booking deletion | Delete a booking and confirm its associated storage objects and document records are removed. |
| Cross-user security | Account B cannot list, read, alter, or fetch a signed URL for Account A’s rows/files. |
| Database checks | In Supabase, confirm tables, indexes, RLS policies, bucket privacy, and the profile trigger are present. |
| UI checks | Test desktop and mobile layouts, keyboard address selection, loading states, errors, empty states, and external email link. |

`checklist.md` is the runbook for recording these final manual checks.

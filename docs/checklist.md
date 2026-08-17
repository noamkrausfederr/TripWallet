# Manual verification checklist

Follow these steps to manually verify the core flows in the Trip Wallet MVP.

1. Sign in
   - Open the app and sign in with an email via the Sign-in page.
   - Confirm you receive a magic link and can sign in.

2. Create trip
   - Create a new trip with name, destination, start date and end date.
   - Verify the trip appears in `My Trips`.

3. Create booking
   - Open a trip and add a booking with title, type, date, and time.
   - Verify the booking appears in the trip details sorted chronologically.

4. Upload document
   - When creating a booking, upload a PDF or image (JPG/PNG) under 5MB.
   - Verify upload succeeds and the booking shows the document file name.

5. View document
   - Click "View ticket" on a booking document.
   - Confirm a new tab opens with the document content (short-lived signed URL).

6. Edit / Delete booking
   - Edit a booking and change title/time; save and verify changes.
   - Delete a booking; confirm booking is removed and any storage objects were deleted (check Supabase Storage dashboard).

7. Delete document
   - Delete an individual document from a booking; verify the DB row and storage object are removed.

8. Cross-user verification
   - Create two test accounts (User A and User B).
   - As User A, create a trip, booking, and upload a document.
   - Sign in as User B and verify you cannot view User A's trips, bookings, or documents (they should not appear or should return forbidden via API).

If any step fails, check the browser console and the Next.js server logs for errors, then check Supabase Auth/Policies and Storage permissions.

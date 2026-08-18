# Presentation outline (10–15 minutes)

Use this short outline to explain and demo your project in a 10–15 minute slot.

## 1. Problem & Value (2 minutes)

**Key points to cover:**
- **The problem**: Travel documents are scattered across email, SMS, screenshots, and browser bookmarks. Users waste time searching for confirmation numbers, flight times, and booking details before a trip.
- **The solution**: Trip Wallet centralizes all travel confirmations in one secure, organized place.
- **Core benefit**: Quick access to all trip details in one app, with automatic chronological sorting of bookings.

**Demo talking points:**
- "Imagine planning a 5-city European trip across 3 weeks. You have airline bookings, Airbnb confirmations, restaurant reservations, activity tickets, and transport passes—all scattered across different apps and inboxes."
- "Trip Wallet solves this: one unified view of everything you need for each trip, in chronological order, with uploaded confirmation documents accessible in one tap."

---

## 2. Live Demo (4–6 minutes)

**Flow to demonstrate:**

### 2.1 Sign in (30 seconds)
- Open the app at the live Vercel link.
- Click "Sign in", enter your email.
- Show the magic link in inbox (or use a test email).
- Click the link and show successful sign-in.

### 2.2 My Trips (1 minute)
- Show the empty trips page after first sign-in.
- Create a new trip: name it (e.g., "Paris 2026"), select destination (use autocomplete), set dates.
- Show the trip appears in "My Trips" list.

### 2.3 Create booking (1.5 minutes)
- Open the trip.
- Add a booking: title (e.g., "Flight to Paris"), type (select "Flight"), date/time, address (use autocomplete).
- Optionally add confirmation number, notes.
- Upload a PDF/JPG ticket (keep under 5 MB).
- Save the booking.
- Show the booking appears on the trip page, sorted chronologically.

### 2.4 View document (1 minute)
- Click "View document" on a booking.
- Show a new browser tab opens with the document (short-lived signed URL).
- Explain: "This is a secure, time-limited link—only you can view your documents, and the link expires after 1 minute."

### 2.5 Edit and delete (1 minute)
- Edit a booking: change the title or time, save, and show the update.
- Delete an individual document, then delete a booking.
- Confirm each is removed from the UI and explain deletion cleans up Supabase Storage.

---

## 3. Technical Architecture (2 minutes)

**High-level diagram to explain verbally:**
```
Frontend (Next.js + React)
    ↓
API Routes (Node.js on Vercel)
    ↓
Backend: Supabase (Postgres + Auth + Storage)
```

**Key points:**
- **Frontend**: Next.js with TypeScript. Components for trips, bookings, file upload.
- **Backend**: Supabase handles database (Postgres), user authentication (magic links), and file storage (private bucket).
- **API layer**: A few Node.js API routes on Vercel handle sensitive operations:
  - Generating signed URLs for document access (requires server secret key).
  - Deleting documents from Storage (requires server secret key).
  - These keep API keys safe and validate user ownership.

**Why this architecture?**
- "Most of the work happens on the frontend for speed and simplicity. Only operations that need a secret key run on the server. This is typical for modern web apps."

---

## 4. Data Model (1 minute)

**Tables:**
- `profiles` — user accounts (managed by Supabase Auth).
- `trips` — user's trips (name, destination, dates).
- `bookings` — bookings within a trip (title, type, date, address, notes).
- `booking_documents` — uploaded documents per booking (filename, storage path).

**Key relationships:**
- A user has many trips.
- A trip has many bookings.
- A booking has zero or more documents.

**Indexes**: Trip user ID, booking trip ID, booking user ID, and booking date are indexed for fast queries.

---

## 5. Tests & Verification (1–2 minutes)

**What we test:**
- **Unit tests**: Trip date validation, file size/type validation, booking sort order.
- **API security tests**: Endpoints require authentication; users cannot access other users' data.
- **UI tests**: Booking creation flow, file upload, signed URL viewing, and document deletion.

**Current test suite: 16 tests, all passing** ✓

**Manual verification steps** (documented in `docs/checklist.md`):
- Sign in with magic link.
- Create trip and add bookings.
- Upload a document and view it.
- Verify cross-user isolation: create two accounts and confirm User B cannot see User A's trips.

**Why testing matters:** "For a real product, tests catch regressions and give confidence that features work as intended. These tests validate the core flows and security properties."

---

## 6. Security & Scale (1 minute)

### Security:
- **Authentication**: Email-based magic links (no passwords).
- **Authorization**: Row-level security (RLS) policies ensure users only see their own data.
- **Storage**: Private Supabase Storage bucket; files accessed via short-lived signed URLs (expire in ~60 seconds).
- **Secrets**: API keys stored server-side only (Vercel environment variables).

### Scalability:
- **Current load**: Handles 10s–100s of users easily.
- **Database indexes**: Queries are fast even with hundreds of bookings per trip.
- **Future improvements**: Pagination for very large booking lists, caching signed URLs, and archival of old trips.

**Takeaway**: "The architecture is simple and secure for an MVP. As the product scales, we'd add pagination, caching, and more sophisticated monitoring."

---

## 7. Future Improvements (30 seconds)

If you had more time:
- **Multiple documents per booking** — allow multiple ticket variations or confirmations.
- **Trip sharing** — invite friends to view shared trip details.
- **Recurring bookings** — support multi-leg flights and auto-sort complex itineraries.
- **Notifications** — email reminders X days before trip departure.
- **Offline access** — cache trip data locally so users can access details without internet.
- **Export** — download trips as PDF or calendar format.

---

## 8. Q&A / Wrap-up (open-ended)

Close with: **"The goal of this project was to think like a full-stack engineer: identify a real problem, design a solution, build it securely, test it thoroughly, and deploy it to users. I'm proud of the clarity and simplicity of the implementation, and happy to answer any questions."**

---

## Tips for a great presentation

1. **Keep it live**: Demonstrate the app running on Vercel, not just screenshots. It's more impressive.
2. **Tell a story**: Don't just list features; explain why each choice was made.
3. **Be honest about tradeoffs**: "We chose simplicity over advanced features because this is an MVP."
4. **Show your understanding**: Be ready to explain why RLS is important, or why we delete documents from Storage.
5. **Have a backup**: If the live app has issues, have a local build ready to show.
6. **Practice timing**: Aim for exactly 10–15 minutes so you're not rushed.

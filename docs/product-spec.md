# Product Specification — Trip Wallet

## Problem

Travel confirmations are scattered across email, messaging apps, screenshots, and booking sites. At the airport, hotel, or activity venue, finding a confirmation number or document quickly is stressful and error-prone.

## Users and customer

The primary user and customer is an independent traveler planning a leisure or business trip. The MVP is also useful for a travel organizer who manages several personal trips. Each account owns only its own trips and documents.

## Value and business goals

Trip Wallet gives travelers one private, chronological place for itinerary details and confirmations. The business goal of this MVP is to validate that centralized trip organization reduces the time and effort needed to locate travel information. Success can be measured by completed trip creation, bookings added per trip, and successful document retrieval.

## MVP capabilities

- Passwordless email sign-in with Supabase Auth.
- Create and browse trips with a name, destination, and date range.
- Add, read, update, and delete bookings within a trip.
- Categorize bookings as flight, accommodation, transport, activity, restaurant, or other.
- Search destinations and addresses through Geoapify autocomplete.
- Upload PDF, JPG, or PNG confirmations up to 5 MB.
- View private documents through a one-minute signed URL and delete a document when it is no longer needed.
- Present bookings in chronological order.

## Main user journeys

1. A traveler enters an email address and follows the magic link to sign in.
2. The traveler creates a trip and chooses a destination and dates.
3. The traveler adds a booking with date, time, address, confirmation number, notes, and optionally a ticket file.
4. The traveler opens the trip timeline, edits or deletes a booking, views a document, or deletes an individual document.

## Scope decisions

This is a focused MVP. Sharing trips, expense tracking, OCR, notifications, offline mode, and multi-user roles are future features, not implied promises in the current product.

import { describe, it, expect } from 'vitest';
import { isBookingDateWithinTrip } from '../src/lib/bookingValidation';

describe('Trip date validation', () => {
  it('accepts end date equal to start date', () => {
    expect(isBookingDateWithinTrip('2026-10-01', '2026-10-01', '2026-10-01')).toBe(true);
  });

  it('rejects a booking outside the trip date range', () => {
    expect(isBookingDateWithinTrip('2026-10-05', '2026-10-01', '2026-10-04')).toBe(false);
  });
});

describe('Booking chronological sort', () => {
  it('sorts by date then time', () => {
    const bookings = [
      { id: 1, booking_date: '2026-10-05', booking_time: '12:00' },
      { id: 2, booking_date: '2026-10-04', booking_time: '09:00' },
      { id: 3, booking_date: '2026-10-04', booking_time: '08:00' },
    ];
    bookings.sort((a, b) => {
      if (a.booking_date < b.booking_date) return -1;
      if (a.booking_date > b.booking_date) return 1;
      return (a.booking_time || '') < (b.booking_time || '') ? -1 : 1;
    });
    expect(bookings.map(b => b.id)).toEqual([3,2,1]);
  });
});

import { describe, it, expect } from 'vitest';

function isEndDateValid(start: string, end: string) {
  return new Date(end) >= new Date(start);
}

describe('Trip date validation', () => {
  it('accepts end date equal to start date', () => {
    expect(isEndDateValid('2026-10-01', '2026-10-01')).toBe(true);
  });

  it('rejects end date before start date', () => {
    expect(isEndDateValid('2026-10-05', '2026-10-01')).toBe(false);
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

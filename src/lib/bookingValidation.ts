export function isBookingDateWithinTrip(bookingDate: string, startDate: string, endDate: string) {
  return Boolean(bookingDate && startDate && endDate) && bookingDate >= startDate && bookingDate <= endDate;
}

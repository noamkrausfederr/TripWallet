import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

type Booking = {
  id: string;
  title: string;
  type: string;
  booking_date: string;
  booking_time?: string;
  confirmation_number?: string;
  notes?: string;
};

function formatDay(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTripDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const sameDay = startDate === endDate;
  const sameYear = start.getFullYear() === end.getFullYear();

  const day = new Intl.DateTimeFormat(undefined, { day: 'numeric' });
  const month = new Intl.DateTimeFormat(undefined, { month: 'short' });
  const year = new Intl.DateTimeFormat(undefined, { year: 'numeric' });
  const full = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  if (sameDay) return full.format(start);
  if (sameYear) return `${day.format(start)} ${month.format(start)} – ${day.format(end)} ${month.format(end)}, ${year.format(end)}`;
  return `${full.format(start)} – ${full.format(end)}`;
}

function formatTime(value?: string) {
  if (!value) return 'Any time';
  const date = new Date(`1970-01-01T${value}`);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeBadge(type: string) {
  const key = type.toLowerCase();
  const className = `badge ${
    key === 'flight'
      ? 'badge-flight'
      : key === 'accommodation'
      ? 'badge-accommodation'
      : key === 'transport'
      ? 'badge-transport'
      : key === 'activity'
      ? 'badge-activity'
      : key === 'restaurant'
      ? 'badge-restaurant'
      : 'badge-other'
  }`;
  return <span className={className}>{type}</span>;
}

export default function TripDetails() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).single();
      setTrip(tripData || null);
      const { data: b } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      setBookings(b || []);
    }
    load();
  }, [id]);

  if (!trip) return <main className="trip-details-page"><div className="status-card">Loading trip details…</div></main>;

  const bookingsByDate = bookings.reduce((acc: Record<string, Booking[]>, booking) => {
    const day = booking.booking_date;
    acc[day] = acc[day] || [];
    acc[day].push(booking);
    return acc;
  }, {});

  return (
    <main className="trip-details-page">
      <div className="page-header">
        <div>
          <h1>{trip.name}</h1>
          <p className="page-copy trip-subtitle">
            <span>{trip.destination}</span>
            <span className="trip-date-range">{formatTripDateRange(trip.start_date, trip.end_date)}</span>
          </p>
        </div>
        <div className="hero-actions">
          <button className="button" onClick={() => router.push(`/trips/${id}/bookings/new`)}>
            Add booking
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="status-card">No bookings yet. Add your first itinerary item.</div>
      ) : (
        <div className="timeline">
          {Object.keys(bookingsByDate).map((day) => (
            <div key={day} className="timeline-day">
              <div className="timeline-day-label">{formatDay(day)}</div>
              {bookingsByDate[day].map((booking) => (
                <div key={booking.id} className="timeline-item">
                  <div className="timeline-time">{formatTime(booking.booking_time)}</div>
                  <div
                    className="timeline-content booking-summary-card"
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/trips/${id}/bookings/${booking.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/trips/${id}/bookings/${booking.id}`);
                      }
                    }}
                  >
                    <div className="timeline-row">
                      <div>
                        <h2>{booking.title}</h2>
                        <div className="meta">{typeBadge(booking.type)}</div>
                      </div>
                      </div>
                    {booking.confirmation_number && <p className="meta">Confirmation: {booking.confirmation_number}</p>}
                    {booking.notes && <p className="booking-notes">{booking.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <footer className="trip-detail-footer">
        <Link href="/trips" className="button">BACK TO MY TRIPS</Link>
      </footer>
    </main>
  );
}

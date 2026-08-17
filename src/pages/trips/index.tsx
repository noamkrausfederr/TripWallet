import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Trip = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    async function load() {
      const user = await supabase.auth.getUser().then((r) => r.data.user);
      if (!user) return;
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
      if (error) {
        console.error(error);
      } else {
        setTrips(data || []);
      }
    }
    load();
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [trips]);

  return (
    <main>
      <div className="page-header">
        <div>
          <h1 className="section-kicker">MY TRIPS</h1>
          <p className="page-copy">Browse your upcoming journey plans and open any trip for details.</p>
        </div>
        <Link href="/trips/new" className="create-trip-link">
          Create trip
        </Link>
      </div>

      {loading ? (
        <div className="status-card">Loading trips…</div>
      ) : trips.length === 0 ? (
        <div className="status-card">No trips yet. Create one to get started.</div>
      ) : (
        <ul className="trip-list">
          {trips.map((trip) => (
            <li key={trip.id} className="trip-card">
              <Link href={`/trips/${trip.id}`} className="trip-card-link">
                <div className="trip-card-main">
                  <div>
                    <h2 className="trip-card-title">{trip.name}</h2>
                    <p className="trip-card-destination">{trip.destination}</p>
                  </div>
                  <p className="trip-card-dates">
                    {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                  </p>
                </div>
                <div className="trip-card-footer">
                  <span className="badge badge-neutral">Travel plan</span>
                  <span className="trip-card-open">Open trip →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

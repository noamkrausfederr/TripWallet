import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import AddressAutocomplete from '../../components/AddressAutocomplete';

export default function NewTripPage() {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleCreate() {
    setError('');
    if (!name || !destination || !startDate || !endDate) {
      setError('Please fill all required fields.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return;
    }
    const user = await supabase.auth.getUser().then((r) => r.data.user);
    if (!user) {
      setError('Not authenticated.');
      return;
    }
    const { data, error } = await supabase
      .from('trips')
      .insert([
        {
          user_id: user.id,
          name,
          destination,
          start_date: startDate,
          end_date: endDate,
        },
      ])
      .select()
      .single();
    if (error) {
      setError(error.message);
    } else {
      router.push(`/trips/${data.id}`);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header className="auth-nav">
          <Link href="/" className="auth-wordmark">trip wallet</Link>
          <Link href="/trips" className="auth-back">BACK TO MY TRIPS</Link>
        </header>
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
      <section className="auth-card trip-create-card">
        <div className="page-header">
          <div>
            <h1 className="section-kicker">CREATE TRIP</h1>
            <p className="page-copy">Add a new trip so you can save itinerary items and travel documents in one place.</p>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="trip-name">Trip name</label>
          <input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="destination">Destination</label>
          <AddressAutocomplete id="destination" required value={destination} onChange={setDestination} />
        </div>

        <div className="field-group">
          <label htmlFor="start-date">Start date</label>
          <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="end-date">End date</label>
          <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        {error && <p className="form-note" style={{ color: '#bf2600' }}>{error}</p>}

        <div className="form-link-actions">
          <button className="form-link-action" onClick={handleCreate}>CREATE TRIP</button>
        </div>
      </section>
      </section>
    </main>
  );
}

import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { isAllowedFile, storageSafeFileName } from '../../../../lib/fileHelpers';
import { isBookingDateWithinTrip } from '../../../../lib/bookingValidation';
import AddressAutocomplete from '../../../../components/AddressAutocomplete';

export default function NewBooking() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Flight');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function rollbackBooking(bookingId: string, storagePath?: string) {
    if (storagePath) await supabase.storage.from('documents').remove([storagePath]);
    await supabase.from('bookings').delete().eq('id', bookingId);
  }

  async function handleCreate() {
    setError('');
    setSuccess('');
    setLoading(true);
    if (!id) return setError('Missing trip id');
    if (!title.trim() || !date || !address.trim()) {
      setLoading(false);
      return setError('Title, date, and address are required');
    }
    if (file && !isAllowedFile(file)) {
      setLoading(false);
      return setError('Invalid file type or too large (max 5MB)');
    }
    const user = await supabase.auth.getUser().then((r) => r.data.user);
    if (!user) {
      setLoading(false);
      return setError('Not authenticated');
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('start_date,end_date')
      .eq('id', id)
      .single();
    if (tripError || !trip) {
      setLoading(false);
      return setError('Trip not found or you do not have access to it');
    }
    if (!isBookingDateWithinTrip(date, trip.start_date, trip.end_date)) {
      setLoading(false);
      return setError('Booking date must be within the trip dates');
    }

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert([
        {
          trip_id: id,
          user_id: user.id,
          title: title.trim(),
          type,
          booking_date: date,
          booking_time: time || null,
          address: address.trim(),
          confirmation_number: confirmation,
          notes,
        },
      ])
      .select()
      .single();

    if (bErr || !booking) {
      setLoading(false);
      return setError(bErr?.message || 'Failed to create booking');
    }

    if (file) {
      const path = `${user.id}/${booking.id}/${storageSafeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) {
        await rollbackBooking(booking.id);
        setLoading(false);
        return setError(`File upload failed: ${upErr.message}`);
      }
      const { error: docErr } = await supabase.from('booking_documents').insert([
        {
          booking_id: booking.id,
          user_id: user.id,
          file_name: file.name,
          storage_path: path,
          file_type: file.type,
        },
      ]);
      if (docErr) {
        await rollbackBooking(booking.id, path);
        setLoading(false);
        return setError(`Document record failed: ${docErr.message}`);
      }
    }

    setLoading(false);
    setSuccess('Booking created');
    router.push(`/trips/${id}`);
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <header className="auth-nav">
          <Link href="/" className="auth-wordmark">trip wallet</Link>
          <Link href={`/trips/${id}`} className="auth-back">BACK TO TRIP</Link>
        </header>
        <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
        <section className="auth-card trip-create-card booking-create-card">
        <div className="page-header">
          <div>
            <h1 className="section-kicker">ADD BOOKING</h1>
            <p className="page-copy">Log travel plans, tickets, or confirmations for this trip.</p>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="type">Type</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option>Flight</option>
            <option>Accommodation</option>
            <option>Transport</option>
            <option>Activity</option>
            <option>Restaurant</option>
            <option>Other</option>
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="time">Time</label>
          <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="address">Address</label>
          <AddressAutocomplete id="address" required value={address} onChange={setAddress} />
        </div>

        <div className="field-group">
          <label htmlFor="confirmation">Confirmation number (optional)</label>
          <input id="confirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="field-group">
          <label htmlFor="file">Upload ticket/confirmation (PDF, JPG, PNG, max 5MB)</label>
          <input id="file" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        {error && <p className="form-note" style={{ color: '#bf2600' }}>{error}</p>}
        {success && <p className="form-note" style={{ color: '#0f7ea4' }}>{success}</p>}

        <div className="form-link-actions">
          <button className="form-link-action" onClick={handleCreate} disabled={loading}>
            {loading ? 'CREATING…' : 'CREATE BOOKING'}
          </button>
        </div>
      </section>
      </section>
    </main>
  );
}

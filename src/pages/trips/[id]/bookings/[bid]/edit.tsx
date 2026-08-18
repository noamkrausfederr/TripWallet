import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../../lib/supabaseClient';
import { isAllowedFile, storageSafeFileName } from '../../../../../lib/fileHelpers';
import { isBookingDateWithinTrip } from '../../../../../lib/bookingValidation';
import { cleanupBookingDocuments, deleteDocument } from '../../../../../lib/docsApi';
import AddressAutocomplete from '../../../../../components/AddressAutocomplete';

export default function EditBooking() {
  const router = useRouter();
  const { id, bid } = router.query as { id?: string; bid?: string };
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [documents, setDocuments] = useState<{ id: string; file_name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  useEffect(() => {
    if (!bid) return;
    async function load() {
      const { data } = await supabase.from('bookings').select('*').eq('id', bid).single();
      setBooking(data || null);
      if (data) {
        const { data: documentData } = await supabase
          .from('booking_documents')
          .select('id,file_name')
          .eq('booking_id', bid)
          .order('created_at', { ascending: true });
        setDocuments(documentData || []);
      }
      setLoading(false);
    }
    load();
  }, [bid]);

  async function handleSave() {
    setError('');
    setSuccess('');
    setSaving(true);
    if (!booking) return;
    if (!booking.title?.trim() || !booking.booking_date || !booking.address?.trim()) {
      setSaving(false);
      return setError('Title, date, and address are required');
    }
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('start_date,end_date')
      .eq('id', booking.trip_id)
      .single();
    if (tripError || !trip) {
      setSaving(false);
      return setError('Trip not found or you do not have access to it');
    }
    if (!isBookingDateWithinTrip(booking.booking_date, trip.start_date, trip.end_date)) {
      setSaving(false);
      return setError('Booking date must be within the trip dates');
    }
    if (file && !isAllowedFile(file)) {
      setSaving(false);
      return setError('Invalid file type or too large (max 5MB)');
    }
    const { error: uErr } = await supabase
      .from('bookings')
      .update({
        title: booking.title.trim(),
        type: booking.type,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        address: booking.address.trim(),
        confirmation_number: booking.confirmation_number,
        notes: booking.notes,
      })
      .eq('id', booking.id);
    if (uErr) {
      setSaving(false);
      return setError(uErr.message);
    }

    if (file) {
      const user = await supabase.auth.getUser().then((r) => r.data.user);
      if (!user) {
        setSaving(false);
        return setError('Not authenticated');
      }
      const path = `${user.id}/${booking.id}/${storageSafeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (upErr) {
        setSaving(false);
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
        setSaving(false);
        return setError(`Document record failed: ${docErr.message}`);
      }
    }
    setSaving(false);
    setSuccess('Saved');
    router.push(`/trips/${id}`);
  }

  async function handleDelete() {
    if (!booking || !confirm('Delete booking?')) return;

    setError('');
    setSaving(true);
    try {
      await cleanupBookingDocuments(booking.id);
      const { error: deleteError } = await supabase.from('bookings').delete().eq('id', booking.id);
      if (deleteError) throw deleteError;
      router.push(`/trips/${id}`);
    } catch (err: any) {
      setError(`Failed to delete booking: ${err.message || err}`);
      setSaving(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm('Delete this document?')) return;
    setError('');
    setDeletingDocumentId(documentId);
    try {
      await deleteDocument(documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
    } catch (err: any) {
      setError(`Failed to delete document: ${err.message || err}`);
    } finally {
      setDeletingDocumentId(null);
    }
  }

  if (loading) return <main><div className="status-card">Loading...</div></main>;
  if (!booking) return <main><div className="status-card">Booking not found.</div></main>;

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
            <h1 className="section-kicker">EDIT BOOKING</h1>
            <p className="page-copy">Make updates to this itinerary item or upload a new confirmation file.</p>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={booking.title}
            onChange={(e) => setBooking({ ...booking, title: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={booking.type}
            onChange={(e) => setBooking({ ...booking, type: e.target.value })}
          >
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
          <input
            id="date"
            type="date"
            value={booking.booking_date}
            onChange={(e) => setBooking({ ...booking, booking_date: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            value={booking.booking_time || ''}
            onChange={(e) => setBooking({ ...booking, booking_time: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="address">Address</label>
          <AddressAutocomplete
            id="address"
            required
            value={booking.address || ''}
            onChange={(address) => setBooking({ ...booking, address })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="confirmation">Confirmation number</label>
          <input
            id="confirmation"
            value={booking.confirmation_number || ''}
            onChange={(e) => setBooking({ ...booking, confirmation_number: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={booking.notes || ''}
            onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label htmlFor="file">Upload new ticket/confirmation</label>
          <input id="file" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <section className="reservation-documents">
          <h2>Manage documents</h2>
          {documents.length ? (
            <div className="document-list">
              {documents.map((document) => (
                <div key={document.id} className="document-card">
                  <span className="document-name">{document.file_name}</span>
                  <button
                    className="form-link-action"
                    onClick={() => handleDeleteDocument(document.id)}
                    disabled={deletingDocumentId === document.id}
                  >
                    {deletingDocumentId === document.id ? 'DELETING…' : 'DELETE'}
                  </button>
                </div>
              ))}
            </div>
          ) : <p className="page-copy">No documents attached.</p>}
        </section>

        {error && <p className="form-note" style={{ color: '#bf2600' }}>{error}</p>}
        {success && <p className="form-note" style={{ color: '#0f7ea4' }}>{success}</p>}

        <div className="form-link-actions">
          <button className="form-link-action" onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
          <button className="form-link-action" onClick={handleDelete} disabled={saving}>
            DELETE BOOKING
          </button>
        </div>
      </section>
      </section>
    </main>
  );
}

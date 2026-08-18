import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSignedUrl } from '../../../../../lib/docsApi';
import { supabase } from '../../../../../lib/supabaseClient';

type Document = { id: string; file_name: string; file_type: string };

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value?: string) {
  if (!value) return 'Any time';
  return new Date(`1970-01-01T${value}`).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BookingDetails() {
  const router = useRouter();
  const { id, bid } = router.query as { id?: string; bid?: string };
  const [booking, setBooking] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bid) return;
    async function load() {
      const { data, error: bookingError } = await supabase.from('bookings').select('*').eq('id', bid).single();
      if (bookingError || !data) {
        setError('Reservation not found.');
        setLoading(false);
        return;
      }
      const { data: documentData } = await supabase
        .from('booking_documents')
        .select('id,file_name,file_type')
        .eq('booking_id', bid)
        .order('created_at', { ascending: true });
      setBooking(data);
      setDocuments(documentData || []);
      setLoading(false);
    }
    load();
  }, [bid]);

  async function openDocument(documentId: string) {
    try {
      const url = await getSignedUrl(documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(`Unable to open document: ${err.message || err}`);
    }
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
        <section className="auth-card trip-create-card booking-detail-card">
          {loading ? (
            <p className="page-copy">Loading reservation…</p>
          ) : error && !booking ? (
            <p className="form-note booking-detail-error">{error}</p>
          ) : (
            <>
              <div className="booking-detail-heading">
                <div>
                  <p className="section-kicker">RESERVATION DETAILS</p>
                  <h1>{booking.title}</h1>
                </div>
                <Link href={`/trips/${id}/bookings/${bid}/edit`} className="auth-back">EDIT BOOKING</Link>
              </div>

              <dl className="reservation-details">
                <div><dt>Type</dt><dd>{booking.type}</dd></div>
                <div><dt>Date</dt><dd>{formatDate(booking.booking_date)}</dd></div>
                <div><dt>Time</dt><dd>{formatTime(booking.booking_time)}</dd></div>
                {booking.address && <div><dt>Address</dt><dd>{booking.address}</dd></div>}
                {booking.confirmation_number && <div><dt>Confirmation</dt><dd>{booking.confirmation_number}</dd></div>}
              </dl>

              {booking.notes && <section className="reservation-notes"><h2>Notes</h2><p>{booking.notes}</p></section>}

              <section className="reservation-documents">
                <h2>Documents</h2>
                {documents.length ? (
                  <div className="document-list">
                    {documents.map((document) => (
                      <div key={document.id} className="document-card">
                        <div className="document-info">
                          <div className="document-name">{document.file_name}</div>
                          <div className="meta">{document.file_type || 'Uploaded document'}</div>
                        </div>
                        <button className="form-link-action" onClick={() => openDocument(document.id)}>VIEW</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="page-copy">No documents attached.</p>}
              </section>
              {error && <p className="form-note booking-detail-error">{error}</p>}
            </>
          )}
        </section>
      </section>
    </main>
  );
}

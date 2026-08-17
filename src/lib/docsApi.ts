import { supabase } from './supabaseClient';

async function getAccessToken() {
  const s = await supabase.auth.getSession();
  return s.data.session?.access_token ?? null;
}

export async function getSignedUrl(documentId: string) {
  const token = await getAccessToken();
  const resp = await fetch('/api/docs/signed-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ documentId }),
  });
  if (!resp.ok) {
    const j = await resp.json().catch(() => ({}));
    throw new Error(j.error || 'Failed to get signed URL');
  }
  return (await resp.json()).url as string;
}

export async function deleteDocument(documentId: string) {
  const token = await getAccessToken();
  const resp = await fetch('/api/docs/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ documentId }),
  });
  if (!resp.ok) throw new Error('Failed to delete document');
  return true;
}

export async function cleanupBookingDocuments(bookingId: string) {
  const token = await getAccessToken();
  const resp = await fetch('/api/docs/cleanup-by-booking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ bookingId }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(`${resp.status}: ${body.error || 'Failed to cleanup booking documents'}`);
  }
  return true;
}

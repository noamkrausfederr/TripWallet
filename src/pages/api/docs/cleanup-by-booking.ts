import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'documents';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { bookingId } = req.body as { bookingId?: string };
  if (!bookingId) return res.status(400).json({ error: 'bookingId required' });

  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) return res.status(500).json({ error: 'Server misconfiguration' });

    const userClient = createClient(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return res.status(401).json({ error: 'Invalid token' });

    // ensure the booking belongs to the current user (RLS will enforce)
    const { data: booking, error: bErr } = await userClient.from('bookings').select('id').eq('id', bookingId).single();
    if (bErr || !booking) return res.status(403).json({ error: 'Not found or forbidden' });

    const svc = getServiceRoleClient();
    const { data: docs, error: dErr } = await svc.from('booking_documents').select('id,storage_path').eq('booking_id', bookingId);
    if (dErr) return res.status(500).json({ error: dErr.message });

    const paths = (docs || []).map((d: any) => d.storage_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: remErr } = await svc.storage.from(BUCKET).remove(paths);
      if (remErr) console.error('storage remove error', remErr);
    }

    // delete DB rows
    const { error: delErr } = await svc.from('booking_documents').delete().eq('booking_id', bookingId);
    if (delErr) return res.status(500).json({ error: delErr.message });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

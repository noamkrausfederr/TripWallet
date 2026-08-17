import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'documents';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { documentId } = req.body as { documentId?: string };
  if (!documentId) return res.status(400).json({ error: 'documentId required' });

  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  // verify token and that the requester owns the document via RLS
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) return res.status(500).json({ error: 'Server misconfiguration' });

    const userClient = createClient(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData?.user) return res.status(401).json({ error: 'Invalid token' });

    // Use user client (RLS) to ensure the document belongs to the user
    const { data: doc, error: userDocErr } = await userClient.from('booking_documents').select('id,storage_path').eq('id', documentId).single();
    if (userDocErr || !doc) return res.status(403).json({ error: 'Not found or forbidden' });

    const svc = getServiceRoleClient();
    // remove storage object
    const { error: remErr } = await svc.storage.from(BUCKET).remove([doc.storage_path]);
    if (remErr) console.error('storage remove error', remErr);

    // delete DB row using server secret key (service client)
    const { error: delErr } = await svc.from('booking_documents').delete().eq('id', documentId);
    if (delErr) return res.status(500).json({ error: delErr.message });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'documents';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { documentId } = req.body as { documentId?: string };
  const token = req.headers.authorization?.replace('Bearer ', '') || '';

  if (!documentId) return res.status(400).json({ error: 'documentId required' });
  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabasePublishableKey) return res.status(500).json({ error: 'Server misconfiguration' });

  // Verify token belongs to a user
  const userClient = createClient(supabaseUrl, supabasePublishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
  const userId = userData.user.id;

  // Use server secret key (service client) to lookup document and create signed URL
  try {
    const svc = getServiceRoleClient();
    const { data: doc } = await svc
      .from('booking_documents')
      .select('id,storage_path,user_id')
      .eq('id', documentId)
      .single();
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    const path = doc.storage_path;
    const { data } = await svc.storage.from(BUCKET).createSignedUrl(path, 60); // 60s validity
    if (!data || !data.signedUrl) return res.status(500).json({ error: 'Failed to create signed URL' });
    return res.status(200).json({ url: data.signedUrl });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

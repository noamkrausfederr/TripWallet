import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
  if (text.length < 3) return res.status(200).json({ results: [] });

  // Keep the provider key server-only.
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Address autocomplete is not configured.' });

  try {
    const params = new URLSearchParams({ text, format: 'json', limit: '5', apiKey });
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Address autocomplete lookup failed.' });
    }
    const data = await response.json();
    const results = (data.results || []).map((result: any, index: number) => ({
      id: result.place_id || `${result.formatted}-${index}`,
      label: result.formatted,
    })).filter((result: { label?: string }) => Boolean(result.label));
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Geoapify address autocomplete failed', error);
    return res.status(502).json({ error: 'Address autocomplete lookup failed.' });
  }
}

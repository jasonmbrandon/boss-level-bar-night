// GET /api/count?city=los-angeles  ->  { city, count, goal }
import { hasKey, countTag } from './_kit.js';

export default async function handler(req, res) {
  const slug = String((req.query && req.query.city) || 'los-angeles').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60) || 'los-angeles';
  if (!hasKey()) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).json({ city: slug, count: null, goal: 100 }); }
  try {
    const count = await countTag('players:' + slug);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ city: slug, count, goal: 100 });
  } catch (err) {
    console.error('count failed', err.status);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ city: slug, count: null, goal: 100 });
  }
}

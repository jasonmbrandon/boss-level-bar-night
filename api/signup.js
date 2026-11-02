// POST /api/signup  { email, city, role, main, founder, website }
// Creates (or updates) the Kit subscriber and tags them by city, role, favourite game type and founder status.
import { cityOf, hasKey, kit, tagId, countTag } from './_kit.js';

const ROLES = { player: 'role:player', bar: 'role:bar', shop: 'role:game-shop' };
const MAINS = ['fighting', 'racing', 'retro', 'karaoke', 'trivia'];

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }

  const b = await readBody(req);
  if (b.website) return res.status(200).json({ ok: true, cityName: 'your city', count: null }); // bot trap

  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) return res.status(400).json({ error: 'That email doesn\'t look right. Check it and try again.' });
  if (!b.city) return res.status(400).json({ error: 'Add your city so we know where to count you.' });
  const city = cityOf(b.city);

  if (!hasKey()) return res.status(503).json({ error: 'Signups open soon. The list isn\'t connected yet.' });

  try {
    await kit('/subscribers', { method: 'POST', body: { email_address: email } });
    const tags = ['city:' + city.slug, ROLES[b.role] || ROLES.player, 'source:bosslevel-site'];
    const isPlayer = !ROLES[b.role] || b.role === 'player';
    if (isPlayer) tags.push('players:' + city.slug);
    if (MAINS.includes(b.main)) tags.push('main:' + b.main);
    if (b.founder) tags.push('founder-badges');
    for (const name of tags) {
      const id = await tagId(name, true);
      if (id) await kit(`/tags/${id}/subscribers`, { method: 'POST', body: { email_address: email } });
    }
    let count = null;
    try { count = await countTag('players:' + city.slug); } catch { count = null; }
    return res.status(200).json({ ok: true, citySlug: city.slug, cityName: city.name, count, isPlayer });
  } catch (err) {
    console.error('signup failed', err.status, JSON.stringify(err.data || {}));
    if (err.status === 422) return res.status(400).json({ error: 'That email was rejected. Check it and try again.' });
    return res.status(502).json({ error: 'Couldn\'t save that just now. Try again in a minute.' });
  }
}

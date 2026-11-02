// Shared Kit (ConvertKit) helpers for the signup and count endpoints.
// Needs one environment variable on Vercel: KIT_API_KEY (Kit > Settings > Developer > API keys, v4).

const BASE = process.env.KIT_API_BASE || 'https://api.kit.com/v4';

export const LA_AREA = [
  'los angeles', 'la', 'l.a.', 'burbank', 'north hollywood', 'noho', 'glendale', 'pasadena', 'long beach',
  'santa monica', 'san fernando valley', 'the valley', 'van nuys', 'sherman oaks', 'studio city', 'hollywood',
  'west hollywood', 'culver city', 'inglewood', 'torrance', 'downtown la', 'dtla', 'koreatown', 'silver lake',
  'echo park', 'encino', 'reseda', 'northridge', 'woodland hills', 'whittier', 'downey', 'el monte', 'alhambra'
];

export function cityOf(input) {
  const raw = String(input || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const key = raw.toLowerCase().replace(/,.*$/, '').replace(/\b(ca|california)\b/g, '').trim();
  if (LA_AREA.includes(key)) return { slug: 'los-angeles', name: 'Los Angeles' };
  const slug = key.normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const name = raw.replace(/,.*$/, '').replace(/\b\w/g, (c) => c.toUpperCase());
  return { slug: slug || 'unknown', name: name || 'your city' };
}

export function hasKey() { return Boolean(process.env.KIT_API_KEY); }

export async function kit(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'X-Kit-Api-Key': process.env.KIT_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const err = new Error(`Kit ${method} ${path} failed: ${res.status}`);
    err.status = res.status; err.data = data; throw err;
  }
  return data;
}

// Tag ids are looked up by name once per warm function instance.
const tagCache = new Map();
export async function tagId(name, create = true) {
  if (tagCache.has(name)) return tagCache.get(name);
  let after = null;
  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ per_page: '1000' }); if (after) q.set('after', after);
    const d = await kit('/tags?' + q.toString());
    for (const t of d.tags || []) tagCache.set(t.name, t.id);
    if (tagCache.has(name)) return tagCache.get(name);
    if (!d.pagination || !d.pagination.has_next_page) break;
    after = d.pagination.end_cursor;
  }
  if (!create) return null;
  const made = await kit('/tags', { method: 'POST', body: { name } });
  const id = made && made.tag && made.tag.id;
  if (id) tagCache.set(name, id);
  return id || null;
}

export async function countTag(name) {
  const id = await tagId(name, false);
  if (!id) return 0;
  const d = await kit(`/tags/${id}/subscribers?include_total_count=true&per_page=1&status=active`);
  const total = d && (d.pagination && d.pagination.total_count != null ? d.pagination.total_count : d.total_count);
  if (typeof total === 'number') return total;
  // Fallback when the total is not returned: page through and count.
  let n = 0, after = null;
  for (let page = 0; page < 50; page++) {
    const q = new URLSearchParams({ per_page: '1000', status: 'active' }); if (after) q.set('after', after);
    const p = await kit(`/tags/${id}/subscribers?` + q.toString());
    n += (p.subscribers || []).length;
    if (!p.pagination || !p.pagination.has_next_page) break;
    after = p.pagination.end_cursor;
  }
  return n;
}

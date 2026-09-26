const feed = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';

// Only images from currently authorised properties can be served. No arbitrary URL proxying.
export function imageHandler(fetcher = fetch) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
    const slug = String(req.query.property || '');
    const index = Number(req.query.photo ?? -1);
    const size = req.query.size === '700' ? 700 : 1600;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isInteger(index) || index < -1) return res.status(404).end();
    try {
      const response = await fetcher(`${feed}?slug=${encodeURIComponent(slug)}`, {signal:AbortSignal.timeout(10000)});
      if (!response.ok) return res.status(503).end();
      const [property] = await response.json();
      const photo = index === -1 ? property?.cover_photo : property?.photos?.[index];
      if (!photo?.drive_id || !/^[\w-]+$/.test(photo.drive_id)) return res.status(404).end();
      const image = await fetcher(`https://drive.google.com/thumbnail?id=${encodeURIComponent(photo.drive_id)}&sz=w${size}`, {signal:AbortSignal.timeout(15000)});
      const type = image.headers.get('content-type') || '';
      if (!image.ok || !type.startsWith('image/')) return res.status(502).end();
      res.setHeader('Content-Type', type);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(Buffer.from(await image.arrayBuffer()));
    } catch { return res.status(503).end(); }
  };
}
export default imageHandler();

const feed = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';

function imageCandidates(url) {
  const candidates = [url];
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const last = path.split('/').pop() || '';

    if (parsed.hostname === 'static.wixstatic.com' && path.includes('/media/')) {
      const mediaPath = path.split('/v1/')[0];
      const fileName = mediaPath.split('/').pop() || '';
      const base = parsed.origin + mediaPath;
      candidates.unshift(base);
      if (fileName) {
        candidates.unshift(base + '/v1/fit/w_1600,q_90/' + fileName);
        candidates.unshift(base + '/v1/fit/w_700,q_90/' + fileName);
      }
    }

    if (
      parsed.hostname === 'assets.guesty.com' &&
      path.includes('/listing_images_s3/') &&
      !/\.[a-z0-9]{2,5}$/i.test(last)
    ) {
      candidates.push(url + '.jpg');
      const transformed = url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
      candidates.push(transformed);
      candidates.push(transformed + '.jpg');
    }
  } catch {}
  return [...new Set(candidates)];
}

async function fetchImage(fetcher, urls) {
  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname;
      const referer = hostname === 'www.brightlogic-estateagents.co.uk'
        ? 'https://www.hillview.co.uk/'
        : hostname === 'www.krrelocationsgroup.com'
          ? 'https://www.krrelocationsgroup.com/'
          : hostname.endsWith('.googleusercontent.com')
            ? 'https://www.google.com/travel/'
            : hostname === 'media.vrbo.com'
              ? 'https://www.vrbo.com/'
              : hostname === 'ak-d.tripcdn.com' || hostname === 'aw-d.tripcdn.com'
                ? 'https://uk.trip.com/'
                : hostname === 'nezt-property-images.s3.eu-west-2.amazonaws.com'
                  ? 'https://www.nezt.com/'
                  : hostname === 'cf.bstatic.com'
                    ? 'https://www.booking.com/'
                    : 'https://www.brooklandstays.co.uk/';
      const headers = {
        'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
        'referer': referer
      };
      const image = await fetcher(url, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });
      const type = image.headers.get('content-type') || '';
      if (image.ok && type.startsWith('image/')) return { image, type };
      console.error('property-image upstream rejected', { hostname, status: image.status, type });
    } catch (error) {
      console.error('property-image upstream exception', String(error));
    }
  }
  return null;
}

// Only images from currently authorised properties can be served. No arbitrary URL proxying.
export function imageHandler(fetcher = fetch) {
  return async function handler(req, res) {
    const version = String(req.query.v || '');
    res.setHeader('Cache-Control', version ? 'public, max-age=31536000, s-maxage=31536000, immutable' : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();

    const slug = String(req.query.property || '');
    const index = Number(req.query.photo ?? -1);
    const size = req.query.size === '700' ? 700 : 1600;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isInteger(index) || index < -1) {
      return res.status(404).end();
    }

    try {
      const response = await fetcher(`${feed}?slug=${encodeURIComponent(slug)}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        console.error('property-image feed rejected', response.status);
        return res.status(503).end();
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        console.error('property-image feed not array', payload);
        return res.status(503).end();
      }
      const [property] = payload;
      const photo = index === -1 ? property?.cover_photo : property?.photos?.[index];
      let candidates = [];

      if (photo?.drive_id && /^[\w-]+$/.test(photo.drive_id)) {
        candidates = [`https://drive.google.com/thumbnail?id=${encodeURIComponent(photo.drive_id)}&sz=w${size}`];
      } else if (photo?.url) {
        let parsed;
        try { parsed = new URL(String(photo.url)); } catch { return res.status(404).end(); }
        const allowedHosts = new Set([
  'assets.guesty.com',
  'static.wixstatic.com',
  'a0.muscache.com',
  'www.stockleyapartments.co.uk',
  'img1.wsimg.com',
  'l.icdbcdn.com',
  'bookingenginecdn.hostaway.com',
  'www.comfyworkers.com',
  'cf.bstatic.com',
  'images.squarespace-cdn.com',
  'londonexecapartments.com',
  'img.hostify.com',
  'www.brightlogic-estateagents.co.uk',
  'www.krrelocationsgroup.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'media.vrbo.com',
  'ak-d.tripcdn.com',
  'aw-d.tripcdn.com',
  'nezt-property-images.s3.eu-west-2.amazonaws.com'
]);
        if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname)) return res.status(404).end();
        if (parsed.hostname === 'a0.muscache.com') {
          res.statusCode = 302;
          res.setHeader('Location', parsed.toString());
          return res.end();
        }
        candidates = imageCandidates(parsed.toString());
      } else {
        return res.status(404).end();
      }

      const result = await fetchImage(fetcher, candidates);
      if (!result) return res.status(502).end();

      res.setHeader('Content-Type', result.type);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (req.method === 'HEAD') return res.status(200).end();
      const bytes = Buffer.from(await result.image.arrayBuffer());
      return res.status(200).send(bytes);
    } catch (error) {
      console.error('property-image handler exception', error?.stack || String(error));
      return res.status(503).end();
    }
  };
}

export default imageHandler();

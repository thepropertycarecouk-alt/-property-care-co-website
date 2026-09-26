import { readFile } from 'node:fs/promises';

const endpoint = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  const slug = String(req.query.slug || '');
  let property;
  let failed = false;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    try {
      const response = await fetch(`${endpoint}?slug=${encodeURIComponent(slug)}`, {signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('Feed unavailable');
      [property] = await response.json();
    } catch { failed = true; }
  }
  const template = await readFile(new URL('../public/stays/property-template.html', import.meta.url), 'utf8');
  const facts = property ? [property.postcode, property.bedrooms ? `${property.bedrooms} bedrooms` : '', property.sleeps ? `sleeps ${property.sleeps}` : ''].filter(Boolean).join(', ') : '';
  const title = property ? `${property.name} | PCCO Stays` : 'Accommodation sourcing | PCCO Stays';
  const description = property ? `${property.name} — ${facts}. Enquire about your required dates. Availability will be confirmed by our accommodation team.` : 'Send PCCO Stays your location, dates and requirements for accommodation from our UK-wide network.';
  let html = template.replaceAll('%%SLUG%%', escape(property?.slug || '')).replaceAll('%%TITLE%%', escape(title)).replaceAll('%%DESCRIPTION%%', escape(description));
  if (!property) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    html = html.replace('<script src="/stays/property-page.js" defer></script>', '<script src="/stays/property-navigation.js" defer></script>')
      .replace('<p>Loading property details…</p>', '<div class="empty-results"><h1>Let us find your next stay.</h1><p>This property is not currently displayed. Send us your location, dates and requirements and our accommodation team will source suitable options.</p><a class="button button-navy" href="/#enquire">Send us your requirements ↗</a></div>');
  }
  return res.status(failed ? 503 : 200).send(html);
}

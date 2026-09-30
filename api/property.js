import { readFile } from 'node:fs/promises';

const endpoint = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';
const base = 'https://www.thepropertycareco.co.uk';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g,'\\u003c');
const cleanText = value => String(value ?? '').replace(/\s+/g,' ').trim();
const words = (value,max=165) => {
  const s=cleanText(value);
  if(s.length<=max)return s;
  return s.slice(0,max-1).replace(/\s+\S*$/,'')+'…';
};

function seoDescription(p){
  const facts=[
    p.postcode ? 'in '+p.postcode : p.city ? 'in '+p.city : '',
    p.bedrooms!=null ? (Number(p.bedrooms)===0?'studio':p.bedrooms+' bedroom'+(Number(p.bedrooms)===1?'':'s')) : '',
    p.sleeps ? 'sleeps '+p.sleeps : '',
    p.parking ? 'parking details available' : ''
  ].filter(Boolean).join(', ');
  return words(p.name+' — '+facts+'. Enquire with PCCO Stays for current availability and contractor, corporate, relocation or longer-stay requirements.');
}

function ssrContent(p){
  const facts=[
    ['Bedrooms',Number(p.bedrooms)===0?'Studio':p.bedrooms],
    ['Bathrooms',p.bathrooms],
    ['Sleeps',p.sleeps],
    ['Bed configuration',p.bed_configuration],
    ['Parking',p.parking]
  ].filter(x=>x[1]!=null&&x[1]!=='');
  const factHtml=facts.map(([k,v])=>'<div class="fact"><span>'+escape(k)+'</span><strong>'+escape(v)+'</strong></div>').join('');
  const description=p.description
    ? '<p class="property-description">'+escape(p.description)+'</p>'
    : '<p class="property-description">Furnished accommodation available through PCCO Stays for contractor, corporate, relocation and longer-stay enquiries.</p>';
  const features=(Array.isArray(p.included_features)&&p.included_features.length?p.included_features:(p.amenities||[])).filter(Boolean).slice(0,20);
  const featureHtml=features.length
    ? '<h2>Included features</h2><div class="amenities included-features">'+features.map(x=>'<div class="amenity"><span aria-hidden="true">✓</span> '+escape(x)+'</div>').join('')+'</div>'
    : '';
  const location=escape(p.postcode||p.city||'Location available on request');
  return '<div class="property-title-block"><p class="eyebrow">PCCO STAYS · '+escape(p.id)+'</p><h1>'+escape(p.name)+'</h1><p>'+location+' · Furnished accommodation supplied by a PCCO property partner</p></div>'
    +'<div class="property-layout"><div><h2>Property details</h2><div class="key-facts">'+factHtml+'</div>'+description+featureHtml
    +'<section class="network-cta" aria-labelledby="network-title"><div><h3 id="network-title">Enquire about this stay</h3><p>Send PCCO Stays your dates, guest numbers and requirements. Availability and booking details are confirmed by our accommodation team.</p><span class="trust-point">No sourcing fees.</span></div><a class="button button-navy" href="/#enquire">Send us your requirements <span aria-hidden="true">↗</span></a></section>'
    +'</div></div>';
}

function structuredData(p){
  const url=base+'/properties/'+encodeURIComponent(p.slug)+'/';
  const image=base+'/api/property-image?property='+encodeURIComponent(p.slug)+'&size=1600';
  const lodging={
    '@context':'https://schema.org',
    '@type':'Accommodation',
    name:p.name,
    description:seoDescription(p),
    url,
    image:[image]
  };
  if(p.city||p.postcode){
    lodging.address={
      '@type':'PostalAddress',
      ...(p.city?{addressLocality:p.city}:{}),
      ...(p.postcode?{postalCode:p.postcode}:{}),
      addressCountry:'GB'
    };
  }
  if(Number.isFinite(Number(p.bedrooms)))lodging.numberOfBedrooms=Number(p.bedrooms);
  if(Number.isFinite(Number(p.sleeps))&&Number(p.sleeps)>0)lodging.occupancy={'@type':'QuantitativeValue',maxValue:Number(p.sleeps)};
  const amenities=(Array.isArray(p.included_features)&&p.included_features.length?p.included_features:(p.amenities||[])).filter(Boolean).slice(0,20);
  if(amenities.length)lodging.amenityFeature=amenities.map(name=>({'@type':'LocationFeatureSpecification',name,value:true}));
  const breadcrumb={
    '@context':'https://schema.org',
    '@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'PCCO Stays',item:base+'/'},
      {'@type':'ListItem',position:2,name:'Properties',item:base+'/properties/'},
      {'@type':'ListItem',position:3,name:p.name,item:url}
    ]
  };
  return '<script type="application/ld+json">'+json(lodging)+'</script><script type="application/ld+json">'+json(breadcrumb)+'</script>';
}

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
  if (property?.slug && property.slug !== slug) {
    res.setHeader('Location', `/properties/${encodeURIComponent(property.slug)}/`);
    return res.status(301).end();
  }

  const template = await readFile(new URL('../public/stays/property-template.html', import.meta.url), 'utf8');
  const title = property ? `${property.name} | Direct Stay Enquiry | PCCO Stays` : 'Accommodation sourcing | PCCO Stays';
  const description = property ? seoDescription(property) : 'Send PCCO Stays your location, dates and requirements for accommodation from our UK-wide network.';
  const ogImage = property ? `${base}/api/property-image?property=${encodeURIComponent(property.slug)}&size=1600` : `${base}/stays/assets/02_Transparent_Landscape_Logo.png`;
  const content = property ? ssrContent(property) : '<div class="empty-results"><h1>Let us find your next stay.</h1><p>This property is not currently displayed. Send us your location, dates and requirements and our accommodation team will source suitable options.</p><a class="button button-navy" href="/#enquire">Send us your requirements ↗</a></div>';
  const ld = property ? structuredData(property) : '';

  let html = template
    .replaceAll('%%SLUG%%', escape(property?.slug || ''))
    .replaceAll('%%TITLE%%', escape(title))
    .replaceAll('%%DESCRIPTION%%', escape(description))
    .replaceAll('%%OG_IMAGE%%', escape(ogImage))
    .replaceAll('%%JSON_LD%%', ld)
    .replaceAll('%%SSR_CONTENT%%', content);

  if (!property) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    html = html.replace('https://www.thepropertycareco.co.uk/properties//', 'https://www.thepropertycareco.co.uk/properties/');
  }
  return res.status(failed ? 503 : 200).send(html);
}

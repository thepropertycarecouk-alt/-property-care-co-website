const feed='https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1';
const base='https://www.thepropertycareco.co.uk';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=v=>JSON.stringify(v).replace(/</g,'\\u003c');

const locations={
  bristol:{name:'Bristol',terms:['bristol'],intro:'Browse furnished accommodation in Bristol for contractors, project teams, corporate stays and relocation. Compare practical details such as bedrooms, guest capacity and parking, then send PCCO Stays your dates for current availability.'},
  brighton:{name:'Brighton',terms:['brighton'],intro:'Browse furnished accommodation in Brighton and Hove for project teams, business travel and longer stays. Review suitable properties and enquire with PCCO Stays for current availability and booking details.'},
  bracknell:{name:'Bracknell',terms:['bracknell'],intro:'Find furnished accommodation in Bracknell for contractors, corporate assignments and relocation. PCCO Stays can help with individual stays or multiple-property requirements close to local worksites and business areas.'},
  woking:{name:'Woking',terms:['woking'],exclude:['wokingham'],intro:'Browse contractor and corporate accommodation in Woking. Compare furnished properties for teams, assignments and longer stays, then send your dates and requirements to PCCO Stays.'},
  wokingham:{name:'Wokingham',terms:['wokingham'],intro:'Browse furnished accommodation in Wokingham for contractors, corporate stays and relocation. Review the current PCCO Stays collection and enquire for availability, parking and longer-stay requirements.'},
  leeds:{name:'Leeds',terms:['leeds'],intro:'Browse furnished accommodation in Leeds for project teams, contractors and corporate stays. PCCO Stays can support single-property and group requirements with availability confirmed for your dates.'},
  manchester:{name:'Manchester',terms:['manchester'],intro:'Find furnished accommodation in Manchester for contractors, project teams, corporate travel and relocation. Compare available property types and enquire with PCCO Stays for your exact dates and requirements.'},
  cardiff:{name:'Cardiff',terms:['cardiff'],intro:'Browse furnished accommodation in Cardiff for project teams, contractors, corporate assignments and longer stays. Send PCCO Stays your dates, guest numbers and practical requirements for current options.'},
  coventry:{name:'Coventry',terms:['coventry'],intro:'Browse contractor and corporate accommodation in Coventry. Compare furnished properties for teams and longer stays, including parking information where supplied, then enquire with PCCO Stays.'},
  london:{name:'London',terms:['london','wimbledon','richmond','kingston','teddington','isleworth','hampton','kew','west drayton'],intro:'Browse furnished accommodation across London and surrounding areas for contractors, corporate stays, relocation and project teams. PCCO Stays can source around worksite location, guest numbers, parking and stay length.'},
  windsor:{name:'Windsor',terms:['windsor','eton'],intro:'Browse furnished accommodation in and around Windsor and Eton for contractors, corporate assignments and relocation. Review suitable properties and enquire with PCCO Stays for availability and longer-stay requirements.'}
};

function matches(p,cfg){
  const hay=(String(p.city||'')+' '+String(p.postcode||'')+' '+String(p.name||'')).toLowerCase();
  if(cfg.exclude?.some(t=>hay.includes(t)))return false;
  return cfg.terms.some(t=>hay.includes(t));
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=900, stale-while-revalidate=3600');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
  const slug=String(req.query.slug||'').toLowerCase();
  const cfg=locations[slug];
  if(!cfg){
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    return res.status(404).send('<!doctype html><html><head><title>Location not found | PCCO Stays</title></head><body><h1>Location not found</h1><p><a href="/properties/">Browse all accommodation</a></p></body></html>');
  }
  try{
    const r=await fetch(feed,{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw new Error('feed unavailable');
    const all=(await r.json()).filter(p=>p?.published);
    const props=all.filter(p=>matches(p,cfg));
    const title=`Contractor & Corporate Accommodation in ${cfg.name} | PCCO Stays`;
    const description=`${cfg.intro} ${props.length} properties currently displayed in this area.`;
    const cards=props.map(p=>{
      const facts=[
        p.bedrooms!=null?(Number(p.bedrooms)===0?'Studio':p.bedrooms+' bed'+(Number(p.bedrooms)===1?'':'s')):'',
        p.sleeps?'Sleeps '+p.sleeps:'',
        p.parking?'Parking details':''
      ].filter(Boolean).join(' · ');
      const image=base+'/api/property-image?property='+encodeURIComponent(p.slug)+'&size=700'+(p.photo_version?'&v='+encodeURIComponent(p.photo_version):'');
      return '<a class="property-card" href="/properties/'+encodeURIComponent(p.slug)+'/"><div class="property-card-media">'+(p.cover_photo?'<img src="'+esc(image)+'" alt="'+esc(p.name)+'" loading="lazy" width="700" height="525">':'<div class="property-card-no-photo">Photography available on request</div>')+'</div><div class="property-card-body"><div><div class="property-location">'+esc(p.postcode||p.city||cfg.name)+'</div><h3>'+esc(p.name)+'</h3></div><div class="property-facts"><span>'+esc(facts)+'</span></div><span class="property-card-cta">View property →</span></div></a>';
    }).join('');
    const itemList={
      '@context':'https://schema.org',
      '@type':'ItemList',
      name:'PCCO Stays accommodation in '+cfg.name,
      numberOfItems:props.length,
      itemListElement:props.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:base+'/properties/'+p.slug+'/'}))
    };
    const breadcrumb={
      '@context':'https://schema.org',
      '@type':'BreadcrumbList',
      itemListElement:[
        {'@type':'ListItem',position:1,name:'PCCO Stays',item:base+'/'},
        {'@type':'ListItem',position:2,name:'Properties',item:base+'/properties/'},
        {'@type':'ListItem',position:3,name:cfg.name,item:base+'/locations/'+slug+'/'}
      ]
    };
    const html='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#021B3C"><title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+base+'/locations/'+esc(slug)+'/"><meta property="og:type" content="website"><meta property="og:site_name" content="PCCO Stays"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+base+'/locations/'+esc(slug)+'/"><link rel="stylesheet" href="/stays/styles.css"><link rel="stylesheet" href="/stays/marketplace.css"><script type="application/ld+json">'+json(itemList)+'</script><script type="application/ld+json">'+json(breadcrumb)+'</script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner wrap"><a class="brand" href="/" aria-label="PCCO Stays home"><img src="/stays/assets/02_Transparent_Landscape_Logo.png" alt="PCCO Stays — flexible nationwide accommodation" width="1672" height="941"></a><nav id="navigation" aria-label="Main navigation"><a href="/">Accommodation</a><a href="/properties/">Properties</a><a href="/partners/">Partners</a></nav></div></header><main id="main" class="wrap property-browse"><nav class="property-breadcrumb" aria-label="Breadcrumb"><a href="/properties/">← Browse all accommodation</a></nav><div class="browse-intro"><p class="eyebrow"><span class="gold-rule"></span> PCCO STAYS · '+esc(cfg.name.toUpperCase())+'</p><h1>Accommodation in <em>'+esc(cfg.name)+'.</em></h1><p>'+esc(cfg.intro)+'</p><p class="trust-point"><strong>'+props.length+' properties currently displayed.</strong> Availability is confirmed for your dates.</p></div><section aria-labelledby="location-properties"><h2 id="location-properties">Properties in '+esc(cfg.name)+'</h2><div class="property-grid">'+(cards||'<div class="empty-results">No properties are currently displayed in this area. Send us your requirements and we can source from the wider network.</div>')+'</div></section><section class="network-cta"><div><h3>Need something different in '+esc(cfg.name)+'?</h3><p>Tell us the worksite or preferred area, dates, guest numbers, parking and bed requirements. We can source beyond the properties shown online.</p><span class="trust-point">No sourcing fees.</span></div><a class="button button-navy" href="/#enquire">Send us your requirements <span aria-hidden="true">↗</span></a></section></main><footer><div class="wrap footer-bottom"><span>© 2026 PCCO Stays. The Property Care Co.</span><span>All stays subject to availability and confirmation.</span></div></footer></body></html>';
    return res.status(200).send(html);
  }catch{
    return res.status(503).send('<!doctype html><html><head><title>'+esc(cfg.name)+' accommodation | PCCO Stays</title></head><body><h1>'+esc(cfg.name)+' accommodation</h1><p>Property collection temporarily unavailable.</p></body></html>');
  }
}

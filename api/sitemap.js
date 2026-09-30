const feed='https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1';
const base='https://www.thepropertycareco.co.uk';
const xml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

export default async function handler(req,res){
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=900, s-maxage=3600, stale-while-revalidate=86400');
  if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
  try{
    const r=await fetch(feed,{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw new Error('feed unavailable');
    const props=(await r.json()).filter(p=>p&&p.published&&p.slug);
    const fixed=['/','/properties/','/partners/'];
    const urls=[
      ...fixed.map(path=>({loc:base+path,priority:path==='/'?'1.0':'0.8'})),
      ...props.map(p=>({loc:base+'/properties/'+encodeURIComponent(p.slug)+'/',priority:'0.7'}))
    ];
    const body='<?xml version="1.0" encoding="UTF-8"?>\n'
      +'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      +urls.map(u=>'  <url><loc>'+xml(u.loc)+'</loc><changefreq>weekly</changefreq><priority>'+u.priority+'</priority></url>').join('\n')
      +'\n</urlset>';
    return res.status(200).send(body);
  }catch{
    return res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
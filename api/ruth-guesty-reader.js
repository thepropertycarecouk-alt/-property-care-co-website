const HOST = 'ruthtophost.guestybookings.com';

function clean(s='') {
  return String(s).replace(/\\u0026/g,'&').replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\\//g,'/');
}
function uniq(a){return [...new Set(a.filter(Boolean))];}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'method'});
  const id=String(req.query.id||'').trim();
  if(!/^[a-f0-9]{24}$/i.test(id)) return res.status(400).json({error:'bad id'});
  const url='https://'+HOST+'/en/properties/'+id;
  try{
    const r=await fetch(url,{headers:{
      'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language':'en-GB,en;q=0.9'
    },redirect:'follow',signal:AbortSignal.timeout(20000)});
    const html=await r.text();
    const src=clean(html);
    const jsonld=[...src.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1].trim());
    const scripts=uniq([...src.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]));
    const metas={};
    for(const m of src.matchAll(/<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi)) metas[m[1]]=m[2];
    for(const m of src.matchAll(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi)) metas[m[2]]=m[1];
    const urls=uniq([...src.matchAll(/https?:\\?\/\\?\/[^"'<>\\s)]+/g)].map(m=>clean(m[0]).replace(/&amp;/g,'&')));
    const images=urls.filter(u=>/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(u) || /image|photo|picture|cdn/i.test(u)).slice(0,500);
    const around=[];
    let pos=0;
    while((pos=src.indexOf(id,pos))!==-1 && around.length<20){around.push(src.slice(Math.max(0,pos-500),Math.min(src.length,pos+2500)));pos+=id.length;}
    res.status(200).json({status:r.status,finalUrl:r.url,length:src.length,metas,jsonld,scripts:scripts.slice(0,100),images,around});
  }catch(e){
    res.status(500).json({error:String(e?.message||e)});
  }
}
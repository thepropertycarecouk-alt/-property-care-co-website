const CHUNK='https://static.guesty.com/ssrs/booking-engine-page/1609/static/_next/static/chunks/app/%5Blocale%5D/properties/%5Bid%5D/page-1c567c04e274816e.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET') return res.status(405).end();
  try{
    const r=await fetch(CHUNK,{headers:{'user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});
    const js=await r.text();
    const tokens=[...new Set(js.split(/["'`]/).filter(s=>{
      const x=s.toLowerCase();
      return s.length>3 && s.length<600 && (x.includes('api')||x.includes('listing')||x.includes('property')||x.includes('booking')||x.includes('guesty'));
    }))].slice(0,300);
    const snippets=[];
    for(const kw of ['listings','listing','property','booking-engine','api.','/api','guesty']){
      let pos=0,found=0;
      while((pos=js.toLowerCase().indexOf(kw,pos))>=0 && found<12){
        snippets.push(js.slice(Math.max(0,pos-240),Math.min(js.length,pos+500)));
        pos+=kw.length;found++;
      }
    }
    return res.status(200).json({status:r.status,length:js.length,tokens,snippets});
  }catch(e){return res.status(500).json({error:String(e?.message||e)})}
}
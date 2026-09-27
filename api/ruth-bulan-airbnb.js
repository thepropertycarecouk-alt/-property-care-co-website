const TARGET='https://www.airbnb.com/rooms/1742830839248756087';
function clean(s=''){return String(s).replace(/\\u0026/g,'&').replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\\//g,'/')}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET') return res.status(405).end();
  try{
    const r=await fetch(TARGET,{headers:{
      'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language':'en-GB,en;q=0.9'
    },redirect:'follow',signal:AbortSignal.timeout(20000)});
    const html=clean(await r.text());
    const metas={};
    for(const m of html.matchAll(/<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi)) metas[m[1]]=m[2];
    for(const m of html.matchAll(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi)) metas[m[2]]=m[1];
    const snippets={};
    for(const key of ['guest','bedroom','bed','bathroom','parking']){
      const i=html.toLowerCase().indexOf(key);snippets[key]=i>=0?html.slice(Math.max(0,i-500),Math.min(html.length,i+3000)):null;
    }
    return res.status(200).json({status:r.status,finalUrl:r.url,length:html.length,metas,snippets});
  }catch(e){return res.status(500).json({error:String(e?.message||e)})}
}
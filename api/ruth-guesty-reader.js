const HOST = 'ruthtophost.guestybookings.com';
const ALLOWED = new Set(["69e10428789d5b00154bbb60","698db482ce6129001515f7b1","69e10422c5d9020013643e49","6a22d5b4788d7b00133c4b9d","6a350a5014bc910012f74965","698353e181878200140b6aa0","698db44f9ec7200015d974a5","699ed8cead9cf8002bf1f711","698353d881878200140b685c","698db45bcbc22300123d0ed2","698b2fc3e4a0820014848476","69849dcfb50f6b001371a3ec","698b2fce63c2eb00159992f9","699c338a135975001443292b","698db4279ec7200015d970af","698db44208176f00159a3267","69f0729fc317e1001466a9ff","698db4161b615b0014cd18b8","6984b2c3a4721a0012590a59","6984f5c9da6423001eac9702","698db4677a7a510013f3ac14","698db473a191560014149ecf","69f072dd05195100153c88e1","6a7469afc91ae40014ab55dc"]);

function clean(s='') {
  return String(s).replace(/\\u0026/g,'&').replace(/\\u003c/g,'<').replace(/\\u003e/g,'>').replace(/\\\//g,'/');
}
function uniq(a){return [...new Set(a.filter(Boolean))];}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET') return res.status(405).json({error:'method'});
  const id=String(req.query.id||'').trim();
  if(!/^[a-f0-9]{24}$/i.test(id) || !ALLOWED.has(id)) return res.status(404).end();
  const url='https://'+HOST+'/en/properties/'+id;
  try{
    const r=await fetch(url,{headers:{
      'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language':'en-GB,en;q=0.9'
    },redirect:'follow',signal:AbortSignal.timeout(20000)});
    const html=await r.text();
    const src=clean(html);
    const metaPairs=[];
    for(const m of src.matchAll(/<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi)) metaPairs.push([m[1],m[2]]);
    for(const m of src.matchAll(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi)) metaPairs.push([m[2],m[1]]);
    const metas=Object.fromEntries(metaPairs);
    const guestyImages=uniq([
      ...metaPairs.filter(([k])=>k.toLowerCase()==='og:image').map(([,v])=>v),
      ...[...src.matchAll(/https:\/\/assets\.guesty\.com\/image\/upload\/[^"'<>\\s)]+/gi)].map(m=>m[0])
    ]).map(u=>u.replace(/\\\\/g,'')).filter(u=>u.startsWith('https://assets.guesty.com/') && u.includes('/'+id+'/'));
    return res.status(200).json({
      id,status:r.status,finalUrl:r.url,
      title:metas['og:title']||null,
      description:metas['og:description']||null,
      images:guestyImages.slice(0,150),
      imageCount:guestyImages.length
    });
  }catch(e){
    return res.status(500).json({error:String(e?.message||e)});
  }
}
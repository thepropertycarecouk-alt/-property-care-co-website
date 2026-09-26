const PHOTON='https://photon.komoot.io/api/';
const POSTCODES='https://api.postcodes.io';

function tidy(v){return String(v||'').trim().replace(/\s+/g,' ')}
function uniq(items){const seen=new Set();return items.filter(x=>{const k=(x.label+'|'+x.lat+'|'+x.lon).toLowerCase();if(seen.has(k))return false;seen.add(k);return true;})}
function photonLabel(p){
  const bits=[];
  const line=[p.housenumber,p.street||p.name].filter(Boolean).join(' ');
  if(line) bits.push(line);
  for(const v of [p.district,p.city,p.county,p.postcode]){
    if(v && !bits.some(b=>b.toLowerCase()===String(v).toLowerCase())) bits.push(v);
  }
  return bits.join(', ');
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
  const q=tidy(req.query.q).slice(0,120);
  if(q.length<2)return res.status(200).json({ok:true,suggestions:[]});
  try{
    const suggestions=[];
    const compact=q.toUpperCase().replace(/\s+/g,'');
    if(/^[A-Z]{1,2}\d[A-Z\d]?(?:\d[A-Z]{0,2})?$/.test(compact)){
      try{
        const pr=await fetch(POSTCODES+'/postcodes/'+encodeURIComponent(compact)+'/autocomplete',{signal:AbortSignal.timeout(6000)});
        if(pr.ok){
          const pj=await pr.json();
          for(const pc of (pj.result||[]).slice(0,6)){
            const gr=await fetch(POSTCODES+'/postcodes/'+encodeURIComponent(pc),{signal:AbortSignal.timeout(6000)});
            if(gr.ok){
              const gj=await gr.json(),g=gj.result;
              if(g?.latitude!=null&&g?.longitude!=null)suggestions.push({label:g.postcode,lat:g.latitude,lon:g.longitude,type:'postcode'});
            }
          }
        }
      }catch{}
    }
    const u=new URL(PHOTON);
    u.searchParams.set('q',q);
    u.searchParams.set('limit','8');
    u.searchParams.set('lang','en');
    u.searchParams.set('countrycode','GB');
    const r=await fetch(u,{headers:{'Accept':'application/json','User-Agent':'PCCO-Stays/1.0 (thepropertycareco.co.uk)'},signal:AbortSignal.timeout(7000)});
    if(r.ok){
      const j=await r.json();
      for(const f of j.features||[]){
        const [lon,lat]=f.geometry?.coordinates||[];
        const p=f.properties||{};
        if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
        const label=photonLabel(p);
        if(label)suggestions.push({label,lat,lon,type:p.osm_value||p.type||'place',postcode:p.postcode||null});
      }
    }
    return res.status(200).json({ok:true,suggestions:uniq(suggestions).slice(0,8)});
  }catch(e){
    console.error(e);
    return res.status(503).json({ok:false,error:'Location suggestions are temporarily unavailable.'});
  }
}

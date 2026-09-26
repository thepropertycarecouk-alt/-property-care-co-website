const feed = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';
const POSTCODE_API = 'https://api.postcodes.io';

function haversineMiles(aLat,aLon,bLat,bLon){
  const toRad=v=>v*Math.PI/180;
  const R=3958.7613;
  const dLat=toRad(bLat-aLat), dLon=toRad(bLon-aLon);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
async function geocode(q){
  const cleaned=String(q||'').trim().toUpperCase().replace(/\s+/g,' ');
  if(!cleaned) return null;
  const full=await fetch(POSTCODE_API+'/postcodes/'+encodeURIComponent(cleaned),{signal:AbortSignal.timeout(8000)});
  if(full.ok){const j=await full.json();if(j?.result?.latitude!=null&&j?.result?.longitude!=null)return {latitude:j.result.latitude,longitude:j.result.longitude,label:j.result.postcode||cleaned};}
  const outcode=cleaned.replace(/\s+/g,'').match(/^[A-Z]{1,2}\d[A-Z\d]?/)?.[0];
  if(!outcode)return null;
  const out=await fetch(POSTCODE_API+'/outcodes/'+encodeURIComponent(outcode),{signal:AbortSignal.timeout(8000)});
  if(!out.ok)return null;
  const j=await out.json();
  return j?.result?.latitude!=null&&j?.result?.longitude!=null?{latitude:j.result.latitude,longitude:j.result.longitude,label:j.result.outcode||outcode}:null;
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Method not allowed'});
  const q=String(req.query.postcode||'').trim();
  const rawLat=Number(req.query.lat),rawLon=Number(req.query.lon);
  const hasCoords=Number.isFinite(rawLat)&&Number.isFinite(rawLon)&&rawLat>=49&&rawLat<=61&&rawLon>=-9&&rawLon<=3;
  const radius=Math.min(50,Math.max(1,Number(req.query.radius||50)));
  if(!hasCoords&&(!q||q.length>120))return res.status(400).json({ok:false,error:'Choose a valid UK location.'});
  try{
    const centre=hasCoords?{latitude:rawLat,longitude:rawLon,label:String(req.query.label||q||'Selected location').slice(0,160)}:await geocode(q);
    if(!centre)return res.status(404).json({ok:false,error:'Location not found.'});
    const feedRes=await fetch(feed+'?summary=1',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!feedRes.ok)throw new Error('Property feed unavailable');
    const properties=(await feedRes.json()).filter(p=>p?.published&&p?.postcode);
    const unique=[...new Set(properties.map(p=>String(p.postcode).trim().toUpperCase()).filter(Boolean))];
    const geo=new Map();
    const full=unique.filter(pc=>/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(pc));
    for(let i=0;i<full.length;i+=100){
      const batch=full.slice(i,i+100);
      const r=await fetch(POSTCODE_API+'/postcodes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postcodes:batch}),signal:AbortSignal.timeout(10000)});
      if(!r.ok)throw new Error('Postcode lookup unavailable');
      const j=await r.json();
      for(const item of j?.result||[]){const g=item?.result;if(g?.postcode&&g.latitude!=null&&g.longitude!=null)geo.set(String(item.query).trim().toUpperCase(),g);}
    }
    const outcodes=unique.filter(pc=>/^[A-Z]{1,2}\d[A-Z\d]?$/.test(pc));
    await Promise.all(outcodes.map(async pc=>{
      try{
        const r=await fetch(POSTCODE_API+'/outcodes/'+encodeURIComponent(pc),{signal:AbortSignal.timeout(6000)});
        if(r.ok){const j=await r.json();if(j?.result?.latitude!=null&&j?.result?.longitude!=null)geo.set(pc,j.result);}
      }catch{}
    }));
    const matches=properties.map(p=>{
      const g=geo.get(String(p.postcode).trim().toUpperCase());
      if(!g)return null;
      const distance=haversineMiles(centre.latitude,centre.longitude,g.latitude,g.longitude);
      return distance<=radius?{slug:p.slug,distance_miles:Number(distance.toFixed(1))}:null;
    }).filter(Boolean).sort((a,b)=>a.distance_miles-b.distance_miles);
    return res.status(200).json({ok:true,query:centre.label,radius_miles:radius,matches});
  }catch(e){
    console.error(e);
    return res.status(503).json({ok:false,error:'Location search is temporarily unavailable.'});
  }
}

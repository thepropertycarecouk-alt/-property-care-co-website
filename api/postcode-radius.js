const feed = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';
const POSTCODE_API = 'https://api.postcodes.io';
const PHOTON_API = 'https://photon.komoot.io/api/';

function haversineMiles(aLat,aLon,bLat,bLon){
  const toRad=v=>v*Math.PI/180;
  const R=3958.7613;
  const dLat=toRad(bLat-aLat), dLon=toRad(bLon-aLon);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function outwardCode(value){
  const cleaned=String(value||'').trim().toUpperCase().replace(/\s+/g,' ');
  if(!cleaned)return null;
  const first=cleaned.split(' ')[0];
  if(/^[A-Z]{1,2}\d[A-Z\d]?$/.test(first))return first;
  return cleaned.replace(/\s+/g,'').match(/^[A-Z]{1,2}\d[A-Z\d]?/)?.[0]||null;
}
function fallbackPlaceLabel(property){
  let city=String(property?.city||property?.area||property?.location||'').trim().replace(/\s+/g,' ');
  if(!city)return '';
  city=city.replace(/South[- ]East London/ig,'London');
  const name=String(property?.name||'').trim();
  if(/^Berkshire$/i.test(city)&&name.includes(' - ')){
    const prefix=name.split(' - ')[0].trim();
    if(prefix)return prefix+', '+city;
  }
  return city;
}
async function geocode(q){
  const cleaned=String(q||'').trim().toUpperCase().replace(/\s+/g,' ');
  if(!cleaned) return null;
  const full=await fetch(POSTCODE_API+'/postcodes/'+encodeURIComponent(cleaned),{signal:AbortSignal.timeout(8000)});
  if(full.ok){const j=await full.json();if(j?.result?.latitude!=null&&j?.result?.longitude!=null)return {latitude:j.result.latitude,longitude:j.result.longitude,label:j.result.postcode||cleaned};}
  const outcode=outwardCode(cleaned);
  if(!outcode)return null;
  const out=await fetch(POSTCODE_API+'/outcodes/'+encodeURIComponent(outcode),{signal:AbortSignal.timeout(8000)});
  if(!out.ok)return null;
  const j=await out.json();
  return j?.result?.latitude!=null&&j?.result?.longitude!=null?{latitude:j.result.latitude,longitude:j.result.longitude,label:j.result.outcode||outcode}:null;
}
async function geocodePlace(label){
  const q=String(label||'').trim().replace(/\s+/g,' ');
  if(!q)return null;
  const country=/\bjersey\b/i.test(q)?'JE':'GB';
  const attempts=[country,null];
  for(const countrycode of attempts){
    if(!countrycode&&country!=='JE')continue;
    try{
      const u=new URL(PHOTON_API);
      u.searchParams.set('q',q);
      u.searchParams.set('limit','1');
      u.searchParams.set('lang','en');
      if(countrycode)u.searchParams.set('countrycode',countrycode);
      const r=await fetch(u,{headers:{'Accept':'application/json','User-Agent':'PCCO-Stays/1.0 (thepropertycareco.co.uk)'},signal:AbortSignal.timeout(6500)});
      if(!r.ok)continue;
      const j=await r.json();
      const f=j?.features?.[0];
      const [lon,lat]=f?.geometry?.coordinates||[];
      if(Number.isFinite(lat)&&Number.isFinite(lon))return {latitude:lat,longitude:lon};
    }catch{}
  }
  return null;
}
async function buildPostcodeMap(properties){
  const unique=[...new Set(properties.map(p=>String(p.postcode||'').trim().toUpperCase()).filter(Boolean))];
  const geo=new Map();
  const full=unique.filter(pc=>/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(pc));
  for(let i=0;i<full.length;i+=100){
    const batch=full.slice(i,i+100);
    const r=await fetch(POSTCODE_API+'/postcodes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postcodes:batch}),signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw new Error('Postcode lookup unavailable');
    const j=await r.json();
    for(const item of j?.result||[]){const g=item?.result;if(g?.postcode&&g.latitude!=null&&g.longitude!=null)geo.set(String(item.query).trim().toUpperCase(),g);}
  }
  const byOutcode=new Map();
  for(const pc of unique){
    if(geo.has(pc))continue;
    const outcode=outwardCode(pc);
    if(!outcode)continue;
    if(!byOutcode.has(outcode))byOutcode.set(outcode,[]);
    byOutcode.get(outcode).push(pc);
  }
  const outcodes=[...byOutcode.keys()];
  for(let i=0;i<outcodes.length;i+=20){
    await Promise.all(outcodes.slice(i,i+20).map(async outcode=>{
      try{
        const r=await fetch(POSTCODE_API+'/outcodes/'+encodeURIComponent(outcode),{signal:AbortSignal.timeout(6000)});
        if(r.ok){
          const j=await r.json(),g=j?.result;
          if(g?.latitude!=null&&g?.longitude!=null)for(const pc of byOutcode.get(outcode)||[])geo.set(pc,g);
        }
      }catch{}
    }));
  }
  return geo;
}
async function buildPropertyLocations(properties){
  const postcodeProperties=properties.filter(p=>p?.postcode);
  const geo=await buildPostcodeMap(postcodeProperties);
  const located=new Map();
  for(const p of properties){
    const key=String(p.postcode||'').trim().toUpperCase();
    const g=key?geo.get(key):null;
    if(g?.latitude!=null&&g?.longitude!=null)located.set(p.slug,{latitude:Number(g.latitude),longitude:Number(g.longitude)});
  }
  const missing=properties.filter(p=>!located.has(p.slug));
  const placeLabels=[...new Set(missing.map(fallbackPlaceLabel).filter(Boolean))];
  const placeGeo=new Map();
  for(let i=0;i<placeLabels.length;i+=8){
    await Promise.all(placeLabels.slice(i,i+8).map(async label=>{
      const g=await geocodePlace(label);
      if(g)placeGeo.set(label,g);
    }));
  }
  for(const p of missing){
    const label=fallbackPlaceLabel(p);
    const g=placeGeo.get(label);
    if(g)located.set(p.slug,g);
  }
  return located;
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Method not allowed'});
  const allMode=String(req.query.all||'')==='1';
  const q=String(req.query.postcode||'').trim();
  const rawLat=Number(req.query.lat),rawLon=Number(req.query.lon);
  const hasCoords=Number.isFinite(rawLat)&&Number.isFinite(rawLon)&&rawLat>=49&&rawLat<=61&&rawLon>=-9&&rawLon<=3;
  const radius=Math.min(25,Math.max(2,Number(req.query.radius||15)));
  if(!allMode&&!hasCoords&&(!q||q.length>120))return res.status(400).json({ok:false,error:'Choose a valid UK location.'});
  try{
    const centre=allMode?null:(hasCoords?{latitude:rawLat,longitude:rawLon,label:String(req.query.label||q||'Selected location').slice(0,160)}:await geocode(q));
    if(!allMode&&!centre)return res.status(404).json({ok:false,error:'Location not found.'});
    const feedRes=await fetch(feed+'?summary=1',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!feedRes.ok)throw new Error('Property feed unavailable');
    const published=(await feedRes.json()).filter(p=>p?.published);
    const locationMap=await buildPropertyLocations(published);
    const located=published.map(p=>{
      const g=locationMap.get(p.slug);
      if(!g)return null;
      return {slug:p.slug,lat:Number(g.latitude),lon:Number(g.longitude)};
    }).filter(Boolean);
    if(allMode){
      return res.status(200).json({
        ok:true,
        mode:'all',
        matches:located,
        mapped_count:located.length,
        published_count:published.length
      });
    }
    const matches=located.map(item=>{
      const distance=haversineMiles(centre.latitude,centre.longitude,item.lat,item.lon);
      return distance<=radius?{...item,distance_miles:Number(distance.toFixed(1))}:null;
    }).filter(Boolean).sort((a,b)=>a.distance_miles-b.distance_miles);
    return res.status(200).json({
      ok:true,
      query:centre.label,
      centre:{lat:centre.latitude,lon:centre.longitude},
      radius_miles:radius,
      matches,
      mapped_count:located.length,
      published_count:published.length
    });
  }catch(e){
    console.error(e);
    return res.status(503).json({ok:false,error:'Location search is temporarily unavailable.'});
  }
}

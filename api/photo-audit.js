const feed='https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed';

function candidates(photo,size=700){
  if(!photo||typeof photo!=='object') return [];
  if(photo.drive_id&&/^[\w-]+$/.test(photo.drive_id)){
    return ['https://drive.google.com/thumbnail?id='+encodeURIComponent(photo.drive_id)+'&sz=w'+size];
  }
  const raw=photo.url||photo.src;
  if(!raw) return [];
  let u;
  try{u=new URL(String(raw));}catch{return []}
  const out=[u.toString()];
  const last=u.pathname.split('/').pop()||'';
  if(u.hostname==='static.wixstatic.com'&&u.pathname.includes('/media/')){
    const mediaPath=u.pathname.split('/v1/')[0];
    const fileName=mediaPath.split('/').pop()||'';
    const base=u.origin+mediaPath;
    out.unshift(base);
    if(fileName){
      out.unshift(base+'/v1/fit/w_700,q_80/'+fileName);
      out.unshift(base+'/v1/fit/w_1600,q_85/'+fileName);
    }
  }
  if(u.hostname==='assets.guesty.com'&&u.pathname.includes('/listing_images_s3/')&&!/\.[a-z0-9]{2,5}$/i.test(last)){
    out.push(u.toString()+'.jpg');
    const transformed=u.toString().replace('/image/upload/','/image/upload/f_auto,q_auto/');
    out.push(transformed,transformed+'.jpg');
  }
  return [...new Set(out)];
}
function headersFor(url){
  let host='';try{host=new URL(url).hostname}catch{}
  const referer=host==='www.brightlogic-estateagents.co.uk'?'https://www.hillview.co.uk/':
    host==='www.krrelocationsgroup.com'?'https://www.krrelocationsgroup.com/':
    host==='a0.muscache.com'?'https://www.airbnb.co.uk/':
    host==='drive.google.com'?'https://drive.google.com/':
    'https://www.thepropertycareco.co.uk/';
  return {
    accept:'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    referer,
    range:'bytes=0-65535'
  };
}
async function checkPhoto(photo){
  const urls=candidates(photo);
  if(!urls.length)return {ok:false,reason:'missing_source'};
  let last='';
  for(const url of urls){
    try{
      const r=await fetch(url,{headers:headersFor(url),redirect:'follow',signal:AbortSignal.timeout(10000)});
      const type=(r.headers.get('content-type')||'').toLowerCase();
      if((r.ok||r.status===206)&&type.startsWith('image/')){
        try{await r.body?.cancel()}catch{}
        return {ok:true,status:r.status,host:new URL(url).hostname};
      }
      last='http_'+r.status+(type?'_'+type.split(';')[0]:'');
      try{await r.body?.cancel()}catch{}
    }catch(e){last=e?.name==='TimeoutError'?'timeout':'fetch_error'}
  }
  return {ok:false,reason:last||'unreachable'};
}
async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let next=0;
  async function worker(){while(true){const i=next++;if(i>=items.length)return;out[i]=await fn(items[i],i)}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));
  return out;
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false});
  const start=Math.max(0,Number(req.query.start)||0);
  const limit=Math.min(25,Math.max(1,Number(req.query.limit)||10));
  try{
    const fr=await fetch(feed,{signal:AbortSignal.timeout(15000)});
    if(!fr.ok)return res.status(503).json({ok:false,error:'feed_'+fr.status});
    const all=await fr.json();
    const slice=all.slice(start,start+limit);
    const results=[];
    for(const p of slice){
      const photos=Array.isArray(p.photos)?p.photos:[];
      const tasks=[{kind:'cover',index:-1,photo:p.cover_photo||photos[0]||null},...photos.map((photo,index)=>({kind:'photo',index,photo}))];
      const checked=await mapLimit(tasks,12,async t=>({...t,...await checkPhoto(t.photo)}));
      results.push({
        id:p.id,slug:p.slug,name:p.name,photo_count:photos.length,
        cover_ok:checked[0]?.ok===true,
        failed:checked.filter(x=>!x.ok).map(x=>({kind:x.kind,index:x.index,reason:x.reason})),
        ok_count:checked.filter(x=>x.ok).length,
        checked_count:checked.length
      });
    }
    return res.status(200).json({ok:true,start,limit,total:all.length,results});
  }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
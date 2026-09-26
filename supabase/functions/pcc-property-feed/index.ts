import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const raw=Deno.env.get('SUPABASE_SECRET_KEYS');
const db=createClient(Deno.env.get('SUPABASE_URL')!,raw?JSON.parse(raw).default:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'};
Deno.serve(async req=>{
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 try{
  // Public read API: both approval and actual partner acceptance are mandatory.
  let q=db.from('pcco_properties').select('id,name,slug,featured,data,pcco_property_partners!inner(acceptance_status)').eq('published',true).eq('pcco_property_partners.acceptance_status','accepted');
  const url=new URL(req.url),slug=url.searchParams.get('slug');
  if(slug)q=q.eq('slug',slug);
  const {data,error}=await q.order('id');if(error)throw error;
  const summary=url.searchParams.get('summary')==='1';
  const fields=summary?['postcode','bedrooms','sleeps','parking','parking_category','cover_photo']:['postcode','city','bedrooms','sleeps','parking','parking_category','cover_photo','photos','bed_configuration','monthly_rate_gbp','monthly_rate_note','security_deposit_gbp','cancellation','amenities'];
  const result=(data||[]).map(p=>Object.assign(Object.fromEntries(fields.filter(k=>p.data[k]!=null).map(k=>[k,p.data[k]])),{id:p.id,name:p.name,slug:p.slug,published:true,featured:p.featured}));
  return new Response(JSON.stringify(result),{headers});
 }catch{return new Response(JSON.stringify({error:'Collection unavailable'}),{status:503,headers});}
});


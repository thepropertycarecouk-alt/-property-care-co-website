import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const raw=Deno.env.get('SUPABASE_SECRET_KEYS');
const db=createClient(Deno.env.get('SUPABASE_URL')!,raw?JSON.parse(raw).default:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'};
Deno.serve(async req=>{
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 try{
  // Public read API: both approval and actual partner acceptance are mandatory.
  let q=db.from('pcco_properties').select('id,partner_id,name,slug,featured,data,pcco_property_partners!inner(acceptance_status)').eq('published',true).eq('pcco_property_partners.acceptance_status','accepted');
  const url=new URL(req.url),slug=url.searchParams.get('slug');
  if(slug)q=q.eq('slug',slug);
  const {data,error}=await q.order('id');if(error)throw error;
  const {data:acceptances,error:ae}=await db.from('pcco_partner_acceptances').select('partner_id,email,terms_version,accepted_at,pcco_partner_invitations!inner(partner_id,terms_version,sent_at,expires_at,revoked_at),pcco_property_partners!inner(email,acceptance_status)').eq('checkbox_accepted',true).is('invalidated_at',null);
  if(ae)throw ae;
  const valid=new Set((acceptances||[]).filter(a=>{const i=a.pcco_partner_invitations,p=a.pcco_property_partners;return i&&p&&p.acceptance_status==='accepted'&&i.partner_id===a.partner_id&&!i.revoked_at&&a.terms_version==='2026-09-26-v1'&&i.terms_version===a.terms_version&&i.sent_at&&new Date(i.sent_at)<=new Date(a.accepted_at)&&new Date(a.accepted_at)<=new Date(i.expires_at)&&a.email.toLowerCase()===p.email.toLowerCase()}).map(a=>a.partner_id));
  const summary=url.searchParams.get('summary')==='1';
  const fields=summary
    ?['postcode','city','bedrooms','sleeps','parking','parking_category','cover_photo','included_features','photo_version']
    :['postcode','city','address','floor_area_sqft','bathrooms','description','bedrooms','sleeps','parking','parking_category','cover_photo','photos','photo_version','bed_configuration','amenities','included_features','guest_extras','important_notes'];
  const result=(data||[]).filter(p=>valid.has(p.partner_id)).map(p=>{
   const publicData=Object.fromEntries(fields.filter(k=>p.data[k]!=null).map(k=>[k,p.data[k]]));
   if(!summary){
    const monthly=Number(p.data.monthly_rate_gbp),sleeps=Number(p.data.sleeps);
    if(Number.isFinite(monthly)&&monthly>0&&Number.isFinite(sleeps)&&sleeps>0)publicData.per_person_night_gbp=Math.max(1,Math.ceil(monthly/30/sleeps));
    if(p.data.security_deposit_gbp!=null)publicData.security_deposit_gbp=p.data.security_deposit_gbp;
   }
   return Object.assign(publicData,{id:p.id,name:p.name,slug:p.slug,published:true,featured:p.featured});
  });
  return new Response(JSON.stringify(result),{headers});
 }catch{return new Response(JSON.stringify({error:'Collection unavailable'}),{status:503,headers});}
});

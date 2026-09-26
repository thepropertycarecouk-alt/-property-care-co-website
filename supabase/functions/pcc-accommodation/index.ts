import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');
const serviceKey = secretKeysRaw ? JSON.parse(secretKeysRaw)['default'] : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession:false, autoRefreshToken:false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const headers = { ...cors, 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' };
const OWNER_EMAIL = 'thepropertycarecouk@gmail.com';
const FROM_EMAIL = 'The Property Care Co. <quotes@thepropertycareco.co.uk>';

function clean(v:unknown,max=300){ return String(v ?? '').trim().slice(0,max); }
function ok(data:unknown,status=200){ return new Response(JSON.stringify(data),{status,headers}); }
function fail(message:string,status=400){ return ok({ok:false,error:message},status); }
function esc(v:unknown){ return String(v ?? '').replace(/[&<>"']/g,(m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m] || m)); }
async function hashIp(ip:string){
  const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip||'unknown'));
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function rateLimit(req:Request){
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `accommodation:${await hashIp(ip)}:${new Date().toISOString().slice(0,13)}`;
  const {data} = await db.from('web_rate_limits').select('request_count').eq('key',key).maybeSingle();
  const count = Number(data?.request_count||0);
  if(count>=8) return false;
  if(data) await db.from('web_rate_limits').update({request_count:count+1,updated_at:new Date().toISOString()}).eq('key',key);
  else await db.from('web_rate_limits').insert({key,window_start:new Date().toISOString(),request_count:1});
  return true;
}
async function resend(payload:any){
  const {data:apiKey,error} = await db.rpc('pcc_get_server_secret',{secret_name:'pcc_resend_api_key'});
  if(error || !apiKey) throw new Error('Email service is unavailable.');
  const r = await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  if(!r.ok){ console.error('Resend error',r.status,(await r.text()).slice(0,500)); throw new Error('Email delivery failed.'); }
}
function row(label:string,value:unknown,max=2000){
  const val=clean(value,max); if(!val) return '';
  return `<tr><td style="padding:8px 10px;border-bottom:1px solid #e7edf5;color:#657287;font:13px Arial">${esc(label)}</td><td style="padding:8px 10px;border-bottom:1px solid #e7edf5;color:#10213d;font:600 13px Arial">${esc(val)}</td></tr>`;
}

Deno.serve(async(req:Request)=>{
  try{
    if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
    if(req.method!=='POST') return fail('Method not allowed',405);
    if(!(await rateLimit(req))) return fail('Too many enquiries. Please try again shortly.',429);
    const body:any = await req.json().catch(()=>({}));
    if(clean(body.website,200)) return fail('Unable to submit.');

    const enquiry_type = clean(body.enquiry_type,40);
    const isPartner = enquiry_type === 'have_accommodation' && body.source === 'website_partners';
    const full_name = clean(body.full_name,100);
    const company = clean(body.company,140);
    const email = clean(body.email,160).toLowerCase();
    const phone = clean(body.phone,40);
    if(!['need_accommodation','have_accommodation'].includes(enquiry_type)) return fail('Please choose the type of enquiry.');
    if(full_name.length<2 || !phone || !email) return fail('Please complete your name, phone number and email address.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email address.');

    if(isPartner) {
      const digits=phone.replace(/\D/g,'');
      if(!/^[+()0-9 .-]+$/.test(phone)||digits.length<7||digits.length>15) return fail('Please enter a valid phone number.');
      const raw=String(body.property_links||'').trim();
      const links=raw.split(/\s+/).filter(Boolean);
      if(raw.length>40000||!links.length||links.length>20||links.some(value=>{
        try {const u=new URL(value);return !['https:','http:'].includes(u.protocol)||!u.hostname.includes('.')||!!u.username||!!u.password;}catch{return true;}
      })) return fail('Please enter valid public property links.');
    }
    const rec:any = {
      enquiry_type, full_name, company:company||null, email, phone,
      location_required:clean(body.location_required,300)||null,
      check_in_date:clean(body.check_in_date,10)||null,
      stay_length:clean(body.stay_length,120)||null,
      guest_count:Number.isFinite(Number(body.guest_count))&&Number(body.guest_count)>0?Math.min(5000,Number(body.guest_count)):null,
      unit_count:Number.isFinite(Number(body.unit_count))&&Number(body.unit_count)>0?Math.min(1000,Number(body.unit_count)):null,
      bedrooms_required:clean(body.bedrooms_required,150)||null,
      parking_required:clean(body.parking_required,60)||null,
      pets:clean(body.pets,60)||null,
      budget:clean(body.budget,120)||null,
      areas_covered:clean(body.areas_covered,500)||null,
      property_count:Number.isFinite(Number(body.property_count))&&Number(body.property_count)>0?Math.min(10000,Number(body.property_count)):null,
      property_types:clean(body.property_types,300)||null,
      minimum_stay:clean(body.minimum_stay,120)||null,
      property_links:clean(body.property_links,isPartner?40000:2000)||null,
      details:clean(body.details,3000)||null,
      status:'new', source:isPartner?'website_partners':'website_accommodation'
    };
    if(enquiry_type==='need_accommodation' && !rec.location_required) return fail('Please tell us where accommodation is required.');
    if(enquiry_type==='have_accommodation' && !isPartner && !rec.areas_covered) return fail('Please tell us which areas your properties cover.');

    const {data:created,error:insertError} = await db.from('accommodation_enquiries').insert(rec).select('id,created_at').single();
    if(insertError || !created) throw insertError || new Error('Could not save enquiry.');

    const isNeed = enquiry_type==='need_accommodation';
    const title = isNeed ? 'New accommodation requirement' : isPartner ? 'New PARTNER / HOST enquiry' : 'New accommodation provider enquiry';
    const recipient = isNeed ? OWNER_EMAIL : 'partners@thepropertycareco.co.uk';
    const detailsRows = [
      row('Name',full_name),row('Company',company),row('Email',email),row('Phone',phone),
      isNeed?row('Location required',rec.location_required):row('Areas covered',rec.areas_covered),
      isNeed?row('Check-in date',rec.check_in_date):'',
      isNeed?row('Length of stay',rec.stay_length):row('Minimum stay',rec.minimum_stay),
      isNeed?row('Guests',rec.guest_count):row('Number of properties',rec.property_count),
      isNeed?row('Units required',rec.unit_count):row('Property types',rec.property_types),
      isNeed?row('Bedrooms required',rec.bedrooms_required):row('Property links',rec.property_links,isPartner?40000:2000),
      row('Parking',rec.parking_required),
      isNeed?row('Pets',rec.pets):'',
      isNeed?row('Budget',rec.budget):'',
      row('Additional details',rec.details)
    ].join('');

    const ownerHtml = `<!doctype html><html><body style="margin:0;background:#f4f8fd"><div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #dce6f2;font-family:Arial,sans-serif"><div style="background:#082d69;color:#fff;padding:18px 22px;font-weight:700">THE PROPERTY CARE CO. · ACCOMMODATION</div><div style="padding:24px"><h1 style="margin:0 0 8px;color:#082d69;font-size:26px">${esc(title)}</h1><p style="color:#657287;margin:0 0 18px">Website enquiry reference: ${esc(created.id)}</p><table style="width:100%;border-collapse:collapse">${detailsRows}</table></div></div></body></html>`;
    const ownerText = `${title}\n\nName: ${full_name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\n${isNeed?`Location required: ${rec.location_required}\nCheck-in: ${rec.check_in_date||''}\nStay: ${rec.stay_length||''}\nUnits: ${rec.unit_count||''}\nGuests: ${rec.guest_count||''}`:`Areas covered: ${rec.areas_covered}\nProperties: ${rec.property_count||''}\nProperty types: ${rec.property_types||''}\nLinks: ${rec.property_links||''}`}\n\nDetails: ${rec.details||''}`;

    const customerSubject = isNeed ? 'We received your accommodation requirement' : 'Thanks — we have received your property';
    const customerCopy = isNeed
      ? 'Thanks for sending your accommodation requirement. We’ll review the location, dates, size and any specific requirements you supplied and come back to you with suitable options.'
      : 'Thanks for sending us your property details. Our partnerships team will review the information and contact you if we need anything else. Your property has not automatically been approved. You can email additional properties to partners@thepropertycareco.co.uk.';
    const customerHtml = `<!doctype html><html><body style="margin:0;background:#f4f8fd"><div style="max-width:600px;margin:24px auto;background:#fff;font-family:Arial,sans-serif"><div style="background:#082d69;color:#fff;padding:16px 22px;font-weight:700">THE PROPERTY CARE CO.</div><div style="padding:26px"><h1 style="color:#082d69;font-size:27px;margin:0 0 14px">${esc(customerSubject)}</h1><p style="color:#10213d;font-size:16px">Hi ${esc(full_name)},</p><p style="color:#59677d;line-height:1.65">${esc(customerCopy)}</p><p style="color:#59677d;line-height:1.65">If anything changes, simply reply to this email or call us on 07411 251361.</p><a href="https://wa.me/447411251361" style="display:inline-block;margin-top:8px;background:#25d366;color:#fff;text-decoration:none;padding:13px 18px;border-radius:10px;font-weight:700">WhatsApp us</a></div></div></body></html>`;

    await Promise.all([
      resend({from:FROM_EMAIL,to:[recipient],reply_to:email,subject:`${title} | ${company||full_name}`,html:ownerHtml,text:ownerText}),
      resend({from:FROM_EMAIL,to:[email],reply_to:recipient,subject:customerSubject,html:customerHtml,text:`Hi ${full_name},\n\n${customerCopy}\n\nIf anything changes, reply to this email or call 07411 251361.\n\nThe Property Care Co.`})
    ]);

    return ok({ok:true,id:created.id,message:isNeed?'Your accommodation requirement has been received.':'Your accommodation details have been received.'});
  }catch(err){
    console.error(err);
    return fail('Something went wrong. Please try again or WhatsApp us.',500);
  }
});

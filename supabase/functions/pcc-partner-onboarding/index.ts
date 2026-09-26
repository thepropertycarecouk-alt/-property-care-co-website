import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
const serviceKey = raw ? JSON.parse(raw).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey!, {auth:{persistSession:false,autoRefreshToken:false}});
const baseHeaders = {
  'Access-Control-Allow-Headers':'content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json',
  'Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer'
};
const allowed = ['https://www.thepropertycareco.co.uk','https://thepropertycareco.co.uk'];

async function hashIp(ip:string){
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(serviceKey || ''), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip || 'unknown'));
  return Array.from(new Uint8Array(sig)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

Deno.serve(async req=>{
  const origin=req.headers.get('origin');
  const h={...baseHeaders,...(origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),Vary:'Origin'};
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:h});
  if(req.method==='OPTIONS')return new Response(null,{headers:h});
  if(req.method!=='POST')return reply({ok:false,error:'Method not allowed'},405);
  if(origin && !allowed.includes(origin)) return reply({ok:false,error:'Origin not allowed'},403);
  try{
    const text=await req.text();
    if(text.length>2048)return reply({ok:false,error:'Invalid request'},400);
    const body=JSON.parse(text);
    if(!/^[a-f0-9]{64}$/.test(body.token||'')||!['inspect','accept'].includes(body.action))return reply({ok:false,error:'Invalid invitation.'},401);
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.token));
    const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
    const {data:invite,error}=await db.from('pcco_partner_invitations').select('id,partner_id,terms_version,expires_at,revoked_at,accepted_at,sent_at').eq('token_hash',hash).maybeSingle();
    if(error)throw error;
    if(!invite||invite.revoked_at||new Date(invite.expires_at)<=new Date())return reply({ok:false,error:'This invitation is invalid or expired. Please contact partners@thepropertycareco.co.uk.'},401);
    if(!invite.sent_at)return reply({ok:false,error:'This invitation has not yet been delivered. Please contact partners@thepropertycareco.co.uk.'},409);
    if(body.terms_version!==invite.terms_version)return reply({ok:false,error:'This invitation uses a different Terms version. Please contact PCCO for the matching acceptance link.'},409);
    const {data:partner,error:partnerError}=await db.from('pcco_property_partners').select('name,company').eq('id',invite.partner_id).single();
    if(partnerError)throw partnerError;
    if(body.action==='inspect')return reply({ok:true,partner,accepted:!!invite.accepted_at});
    if(body.accepted!==true)return reply({ok:false,error:'Please tick the agreement checkbox.'},400);
    const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    const ua=(req.headers.get('user-agent')||'').slice(0,500);
    const {data,error:acceptError}=await db.rpc('pcco_accept_partner_terms',{
      invitation_hash:hash,
      accepted_version:body.terms_version,
      checkbox:true,
      request_user_agent:ua,
      request_ip_hash:await hashIp(ip)
    });
    if(acceptError)throw acceptError;
    return reply({ok:true,accepted:true,accepted_at:data.accepted_at});
  }catch(err){
    console.error(err);
    return reply({ok:false,error:'Unable to record acceptance. Please try again or contact partners@thepropertycareco.co.uk.'},500);
  }
});

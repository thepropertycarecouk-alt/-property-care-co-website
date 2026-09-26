import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const raw=Deno.env.get('SUPABASE_SECRET_KEYS');
const key=raw?JSON.parse(raw).default:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const db=createClient(Deno.env.get('SUPABASE_URL')!,key!,{auth:{persistSession:false,autoRefreshToken:false}});
const headers={'Access-Control-Allow-Origin':'https://www.thepropertycareco.co.uk','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
Deno.serve(async req=>{
 const origin=req.headers.get('origin');const allowed=['https://www.thepropertycareco.co.uk','https://thepropertycareco.co.uk'];
 const h={...headers,...(origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),Vary:'Origin'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:h});
 if(req.method==='OPTIONS')return new Response(null,{headers:h});
 if(req.method!=='POST')return reply({ok:false,error:'Method not allowed'},405);
 // Custom authentication: a cryptographically random 256-bit private invitation token.
 try{
  const text=await req.text();if(text.length>2048)return reply({ok:false,error:'Invalid request'},400);
  const body=JSON.parse(text);
  if(!/^[a-f0-9]{64}$/.test(body.token||'')||!['inspect','accept'].includes(body.action))return reply({ok:false,error:'Invalid invitation.'},401);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.token));
  const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
  const {data:invite,error}=await db.from('pcco_partner_invitations').select('id,partner_id,terms_version,expires_at,revoked_at,accepted_at').eq('token_hash',hash).maybeSingle();
  if(error)throw error;
  if(!invite||invite.revoked_at||new Date(invite.expires_at)<=new Date())return reply({ok:false,error:'This invitation is invalid or expired. Please contact partners@thepropertycareco.co.uk.'},401);
  if(body.terms_version!==invite.terms_version)return reply({ok:false,error:'This invitation uses a different Terms version. Please contact PCCO for the matching acceptance link.'},409);
  const {data:partner,error:partnerError}=await db.from('pcco_property_partners').select('name,company').eq('id',invite.partner_id).single();if(partnerError)throw partnerError;
  if(body.action==='inspect')return reply({ok:true,partner,accepted:!!invite.accepted_at});
  if(body.accepted!==true)return reply({ok:false,error:'Please tick the agreement checkbox.'},400);
  const {data,error:acceptError}=await db.rpc('pcco_accept_partner_terms',{invitation_hash:hash,accepted_version:body.terms_version,checkbox:true});
  if(acceptError)throw acceptError;
  return reply({ok:true,accepted:true,accepted_at:data.accepted_at});
 }catch{return reply({ok:false,error:'Unable to record acceptance. Please try again or contact partners@thepropertycareco.co.uk.'},500);}
});


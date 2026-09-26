-- PCCO Partner onboarding audit hardening — 26 Sep 2026
-- This records invitation delivery, acceptance request metadata, and preserves invalidated test acceptances.

alter table public.pcco_partner_acceptances
  add column if not exists request_user_agent text,
  add column if not exists request_ip_hash text,
  add column if not exists invalidated_at timestamptz,
  add column if not exists invalidated_reason text;

alter table public.pcco_partner_invitations
  add column if not exists sent_at timestamptz,
  add column if not exists sent_to text,
  add column if not exists sent_message_id text,
  add column if not exists delivery_channel text,
  add column if not exists revocation_reason text;

drop function if exists public.pcco_accept_partner_terms(text,text,boolean);

create function public.pcco_accept_partner_terms(
  invitation_hash text,
  accepted_version text,
  checkbox boolean,
  request_user_agent text default null,
  request_ip_hash text default null
) returns jsonb
language plpgsql
set search_path to 'public','pg_temp'
as $function$
declare
  invitation public.pcco_partner_invitations;
  partner public.pcco_property_partners;
  stamp timestamptz;
begin
  if checkbox is distinct from true then raise exception 'Checkbox acceptance is required'; end if;
  select * into invitation from public.pcco_partner_invitations where token_hash=invitation_hash for update;
  if not found or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'Invitation is invalid or expired'; end if;
  if invitation.sent_at is null then raise exception 'Invitation has not been delivered'; end if;
  if invitation.terms_version<>accepted_version then raise exception 'Terms version mismatch'; end if;
  if invitation.accepted_at is not null then return jsonb_build_object('accepted_at',invitation.accepted_at); end if;
  select * into strict partner from public.pcco_property_partners where id=invitation.partner_id;
  stamp=clock_timestamp();
  insert into public.pcco_partner_acceptances(
    invitation_id,partner_id,partner_name,company,email,terms_version,checkbox_accepted,accepted_at,
    request_user_agent,request_ip_hash
  ) values(
    invitation.id,partner.id,partner.name,partner.company,partner.email,invitation.terms_version,true,stamp,
    left(request_user_agent,500),left(request_ip_hash,128)
  );
  update public.pcco_partner_invitations set accepted_at=stamp where id=invitation.id;
  update public.pcco_property_partners set acceptance_status='accepted' where id=partner.id;
  return jsonb_build_object('accepted_at',stamp);
end
$function$;

revoke all on function public.pcco_accept_partner_terms(text,text,boolean,text,text) from public, anon, authenticated;
grant execute on function public.pcco_accept_partner_terms(text,text,boolean,text,text) to service_role;

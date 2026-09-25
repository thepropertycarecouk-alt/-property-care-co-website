'use strict';
const form=document.querySelector('#host-form'),error=document.querySelector('#host-error');
const menu=document.querySelector('.menu-button'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const dialog=document.querySelector('#privacy-dialog');
document.querySelectorAll('.privacy-open').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));
for(const id of ['privacy-close','privacy-done'])document.getElementById(id).addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function fail(message,field){error.textContent=message;error.hidden=false;if(field){field.setAttribute('aria-invalid','true');field.focus();}}
form.addEventListener('input',e=>e.target.removeAttribute('aria-invalid'));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(form.dataset.submitting==='true')return;error.hidden=true;
 for(const input of form.querySelectorAll('input,textarea')){input.value=input.value.trim();input.removeAttribute('aria-invalid');if(!input.checkValidity()){fail(input.type==='email'?'Please enter a valid email address.':'Please complete '+input.closest('label').childNodes[0].textContent.replace('*','').trim().toLowerCase()+'.',input);return;}}
 const d=Object.fromEntries(new FormData(form));
 if(!/^[+()0-9 .-]+$/.test(d.phone)||d.phone.replace(/\D/g,'').length<7||d.phone.replace(/\D/g,'').length>15)return fail('Please enter a valid phone number, including the country code where possible.',form.elements.phone);
 const links=d.property_links.split(/\s+/).filter(Boolean);
 if(links.length>10||links.some(value=>{try{const u=new URL(value);return !['https:','http:'].includes(u.protocol)||!u.hostname.includes('.')||!!u.username||!!u.password;}catch{return true;}}))return fail('Please paste valid public links beginning with https:// or http://, up to 10 links separated by spaces or new lines.',form.elements.property_links);
 if(d.website)return fail('Unable to submit. Please email partners@thepropertycareco.co.uk.');
 const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Sending your property…';form.dataset.submitting='true';form.setAttribute('aria-busy','true');
 try{
 const response=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-accommodation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,enquiry_type:'have_accommodation',source:'website_partners',property_links:links.join('\n')}),signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok||!result.ok)throw new Error(response.status===429?'Too many enquiries. Please try again later or email partners@thepropertycareco.co.uk.':'We could not confirm delivery. Your details are still here. Please email partners@thepropertycareco.co.uk before submitting again.');
 form.hidden=true;const success=document.querySelector('#host-success');success.hidden=false;success.focus();success.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 }catch(e){fail(e.message.startsWith('Too many')||e.message.startsWith('We could')?e.message:'We could not confirm delivery. Your details are still here. Please email partners@thepropertycareco.co.uk before submitting again.');}
 finally{button.disabled=false;button.innerHTML='Join our partner network <span aria-hidden="true">→</span>';form.dataset.submitting='false';form.removeAttribute('aria-busy');}
});

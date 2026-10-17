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

const propertyField=form.querySelector('textarea[name="property_links"]')?.closest('label');
if(propertyField){
 const sourceLabel=document.createElement('label');sourceLabel.className='full';
 sourceLabel.innerHTML='How did you find us? *<select name="discovery_source" id="discovery-source" required><option value="" selected disabled>Please select</option><option>Google Search</option><option>LinkedIn</option><option>Facebook or Social Media</option><option>Referral</option><option>Email from PCCO</option><option>Previous PCCO Partner</option><option>Other</option></select>';
 const otherLabel=document.createElement('label');otherLabel.className='full';otherLabel.id='discovery-source-other-field';otherLabel.hidden=true;
 otherLabel.innerHTML='Please tell us where you found us *<input name="discovery_source_other" id="discovery-source-other" maxlength="140" disabled>';
 propertyField.parentNode.insertBefore(sourceLabel,propertyField);
 propertyField.parentNode.insertBefore(otherLabel,propertyField);
 const source=sourceLabel.querySelector('select'),other=otherLabel.querySelector('input');
 source.addEventListener('change',()=>{const show=source.value==='Other';otherLabel.hidden=!show;other.disabled=!show;other.required=show;if(!show)other.value='';});
}

function fail(message,field){error.textContent=message;error.hidden=false;if(field){field.setAttribute('aria-invalid','true');field.focus();}}
form.addEventListener('input',e=>e.target.removeAttribute('aria-invalid'));
form.addEventListener('change',e=>e.target.removeAttribute('aria-invalid'));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(form.dataset.submitting==='true')return;error.hidden=true;
 for(const input of form.querySelectorAll('input,textarea,select')){if(typeof input.value==='string')input.value=input.value.trim();input.removeAttribute('aria-invalid');if(!input.checkValidity()){fail(input.type==='email'?'Please enter a valid email address.':'Please complete '+input.closest('label').childNodes[0].textContent.replace('*','').trim().toLowerCase()+'.',input);return;}}
 const d=Object.fromEntries(new FormData(form));
 if(!/^[+()0-9 .-]+$/.test(d.phone)||d.phone.replace(/\D/g,'').length<7||d.phone.replace(/\D/g,'').length>15)return fail('Please enter a valid phone number, including the country code where possible.',form.elements.phone);
 if(!d.property_links.trim())return fail('Please add your property details, links or notes.',form.elements.property_links);
 if(d.discovery_source==='Other'&&!String(d.discovery_source_other||'').trim())return fail('Please tell us where you found PCCO Stays.',form.elements.discovery_source_other);
 if(d.website)return fail('Unable to submit. Please email partners@thepropertycareco.co.uk.');
 const discovery=d.discovery_source==='Other'?`Other: ${d.discovery_source_other}`:d.discovery_source;
 const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Sending your property…';form.dataset.submitting='true';form.setAttribute('aria-busy','true');
 try{
 const response=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-accommodation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,enquiry_type:'have_accommodation',source:'website_partners',property_links:d.property_links,details:`How did you find us: ${discovery}`}),signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok||!result.ok)throw new Error(response.status===429?'Too many enquiries. Please try again later or email partners@thepropertycareco.co.uk.':'We could not confirm delivery. Your details are still here. Please email partners@thepropertycareco.co.uk before submitting again.');
 form.hidden=true;const success=document.querySelector('#host-success');success.hidden=false;success.focus();success.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 }catch(e){fail(e.message.startsWith('Too many')||e.message.startsWith('We could')?e.message:'We could not confirm delivery. Your details are still here. Please email partners@thepropertycareco.co.uk before submitting again.');}
 finally{button.disabled=false;button.innerHTML='Join our partner network <span aria-hidden="true">→</span>';form.dataset.submitting='false';form.removeAttribute('aria-busy');}
});
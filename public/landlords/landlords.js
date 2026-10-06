'use strict';
const form=document.querySelector('#landlord-form'),error=document.querySelector('#landlord-error');
const menu=document.querySelector('.menu-button'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
function fail(message,field){error.textContent=message;error.hidden=false;if(field){field.setAttribute('aria-invalid','true');field.focus();}}
form.addEventListener('input',e=>e.target.removeAttribute('aria-invalid'));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(form.dataset.submitting==='true')return;error.hidden=true;
 for(const input of form.querySelectorAll('input,select,textarea')){if(typeof input.value==='string')input.value=input.value.trim();input.removeAttribute('aria-invalid');if(!input.checkValidity()){fail(input.type==='email'?'Please enter a valid email address.':'Please complete '+(input.closest('label')?.childNodes[0]?.textContent||'this field').replace('*','').trim().toLowerCase()+'.',input);return;}}
 const d=Object.fromEntries(new FormData(form));
 const digits=(d.phone||'').replace(/\D/g,'');if(!/^[+()0-9 .-]+$/.test(d.phone)||digits.length<7||digits.length>15)return fail('Please enter a valid phone number, including the country code where possible.',form.elements.phone);
 if(d.website)return fail('Unable to submit. Please call +44 7411 251361.');
 const propertyDetails=`LANDLORD MANAGEMENT ENQUIRY\nProperty location: ${d.property_location}\nBedrooms: ${d.bedrooms}\nBathrooms: ${d.bathrooms}\nParking: ${d.parking}\nCurrent monthly rent: ${d.current_rent?'£'+d.current_rent:'Not provided'}\nProperty status: ${d.property_status}\nFurnished: ${d.furnished}\nPortfolio size: ${d.portfolio_count||'Not provided'}\nAdditional details: ${d.notes||'None provided'}`;
 const payload={enquiry_type:'have_accommodation',source:'website_partners',full_name:d.full_name,company:d.company||'Landlord management enquiry',email:d.email,phone:d.phone,areas_covered:d.property_location,property_count:d.portfolio_count?Number(d.portfolio_count):1,property_types:d.bedrooms,parking_required:d.parking,property_links:propertyDetails,details:`Interested in PCCO serviced accommodation management. Property status: ${d.property_status}. Furnished: ${d.furnished}. Current rent: ${d.current_rent?'£'+d.current_rent:'not provided'}.`,website:d.website||''};
 const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Sending assessment request…';form.dataset.submitting='true';form.setAttribute('aria-busy','true');
 try{
  const response=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-accommodation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
  const result=await response.json();if(!response.ok||!result.ok)throw new Error(response.status===429?'Too many enquiries. Please try again shortly or call us.':'We could not confirm delivery. Your details are still here. Please call +44 7411 251361 before submitting again.');
  form.hidden=true;const success=document.querySelector('#landlord-success');success.hidden=false;success.focus();success.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 }catch(e){fail(e.message.startsWith('Too many')||e.message.startsWith('We could')?e.message:'We could not confirm delivery. Your details are still here. Please call +44 7411 251361 before submitting again.');}
 finally{button.disabled=false;button.innerHTML='Request my property assessment <span aria-hidden="true">→</span>';form.dataset.submitting='false';form.removeAttribute('aria-busy');}
});

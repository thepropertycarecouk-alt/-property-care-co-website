'use strict';
const icons = {
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
 key:'<circle cx="8" cy="8" r="5"/><path d="m11.5 11.5 9 9m-3-3 3-3m-6 0 3-3"/>',
 sofa:'<path d="M4 11V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4M4 19v2m16-2v2M4 11a2 2 0 0 0-2 2v6h20v-6a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-2-2Z"/>',
 wifi:'<path d="M2 8.8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 3.2a6 6 0 0 1 8 0M12 19h.01"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-12 4h2m3 0h2"/>',
 hardhat:'<path d="M3 17h18v3H3zM5 17v-4a7 7 0 0 1 4-6m6 0a7 7 0 0 1 4 6v4M10 13V4h4v9M2 20h20"/>',
 home:'<path d="m2 11 10-8 10 8M5 9v12h14V9M9 21v-8h6v8"/>',
 briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11 0v3h4v-3"/>',
 shield:'<path d="M12 3 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-3Z"/><path d="m8 12 3 3 5-6"/>',
 message:'<path d="M21 11.5A9.5 9.5 0 0 1 7 20l-5 2 2-5A9.5 9.5 0 1 1 21 11.5Z"/><path d="M8 7c.3 4.5 3.5 7.7 8 8l1-2-3-1-1 1-2-2 1-1-1-3Z"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => {el.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24">${icons[el.dataset.icon] || icons.home}</svg>`;});
const $=s=>document.querySelector(s);
const form=$('#requirement-form');
const error=$('#form-error');
let currentStep=1, lastBrief='';
const localDate=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const today=localDate();
$('#arrival').min=today; $('#departure').min=today;
function clearError(){error.hidden=true;error.textContent='';form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));}
function fail(message,field){error.textContent=message;error.hidden=false;if(field){field.setAttribute('aria-invalid','true');field.focus();}return false;}
function validStep(step){
 clearError();
 const section=form.querySelector(`[data-step="${step}"]`);
 for(const el of section.querySelectorAll('input,select,textarea')){
  if(el.disabled)continue;
  if(typeof el.value==='string' && !['checkbox','date'].includes(el.type)) el.value=el.value.trim();
  if(!el.checkValidity()){
   const label=el.closest('label')?.childNodes[0]?.textContent?.trim()||'this field';
   let msg=`Please check ${label.toLowerCase()}.`;
   if(el.validity.valueMissing)msg=el.type==='checkbox'?'Please agree to the enquiry privacy details before continuing.':`Please enter ${label.toLowerCase()}.`;
   if(el.type==='email')msg='Please enter a valid email address.';
   if(el.type==='number')msg=`Please enter a number between ${el.min} and ${el.max}${el.step==='1'?' (whole numbers only)':''}.`;
   return fail(msg,el);
  }
 }
 if(step===1){
  if($('#location').value.length<2)return fail('Please add a town, city, postcode or worksite address.',$('#location'));
  if(!$('#flexible').checked){
   if($('#arrival').value<today)return fail('Please choose an arrival date from today onwards.',$('#arrival'));
   if($('#departure').value<=$('#arrival').value)return fail('Departure must be after the arrival date.',$('#departure'));
  } else if($('#duration').value.length<3)return fail('Please add the expected timing or duration.',$('#duration'));
 }
 if(step===3){const phone=form.querySelector('[name="phone"]');const digits=phone.value.replace(/\D/g,'');if(digits.length<7||digits.length>15||!/^[+()0-9 .-]+$/.test(phone.value))return fail('Please enter a valid phone number, including the country code where possible.',phone);}
 return true;
}
function showStep(step,focus=true){
 currentStep=step; clearError();
 $('#send-panel').hidden=true;form.hidden=false;
 form.querySelectorAll('.form-step').forEach(el=>el.hidden=Number(el.dataset.step)!==step);
 $('.steps').hidden=false;$('#step-count').textContent=`Step ${step} of 3`;
 document.querySelectorAll('.steps li').forEach((el,i)=>{el.classList.toggle('active',i+1===step);el.classList.toggle('complete',i+1<step);if(i+1===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 if(step===3)renderReview();
 if(focus){const panel=$('.enquiry-panel');panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});const heading=form.querySelector(`[data-step="${step}"] h3`);heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
}
function configureDates(){
 const flexible=$('#flexible').checked;
 for(const id of ['arrival','departure']){$('#'+id).disabled=flexible;$('#'+id).required=!flexible;}
 document.querySelectorAll('.date-required').forEach(el=>el.hidden=flexible);
 $('#duration-field').hidden=!flexible;$('#duration').disabled=!flexible;$('#duration').required=flexible;
 clearError();
}
$('#flexible').addEventListener('change',configureDates);
$('#arrival').addEventListener('change',()=>{if($('#arrival').value){const date=new Date($('#arrival').value+'T12:00:00');date.setDate(date.getDate()+1);$('#departure').min=localDate(date);}});
form.addEventListener('input',e=>{if(e.target.hasAttribute('aria-invalid'))e.target.removeAttribute('aria-invalid');});
document.querySelectorAll('.next-step').forEach(btn=>btn.addEventListener('click',()=>{if(validStep(currentStep))showStep(currentStep+1);}));
document.querySelectorAll('.back-step').forEach(btn=>btn.addEventListener('click',()=>showStep(currentStep-1)));
$('.edit-stay').addEventListener('click',()=>showStep(1));
$('#quick-form').addEventListener('submit',e=>{e.preventDefault();$('#location').value=$('#quick-location').value.trim();$('#guests').value=$('#quick-guests').value;showStep(1);location.hash='enquire';$('#location').focus({preventScroll:true});});
document.querySelectorAll('[data-service]').forEach(btn=>btn.addEventListener('click',()=>{$('#service').value=btn.dataset.service;showStep(1);location.hash='enquire';}));
const nav=$('#navigation'),menu=$('.menu-button');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
function formatDate(value){return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00'));}
function getData(){const d=Object.fromEntries(new FormData(form));d.needs=new FormData(form).getAll('needs');d.flexible=$('#flexible').checked;return d;}
function stayDates(d){if(d.flexible)return `Dates to be confirmed — ${d.duration}`;const nights=Math.round((new Date(d.departure+'T12:00:00')-new Date(d.arrival+'T12:00:00'))/86400000);return `${formatDate(d.arrival)} to ${formatDate(d.departure)} (${nights} ${nights===1?'night':'nights'})`;}
function renderReview(){
 const d=getData();const summary=$('#review-summary');summary.replaceChildren();
 const items=[['For',d.service],['Location',d.location],['Guests',`${d.guests}${d.units?` · ${d.units} ${d.units==='1'?'property':'properties'}`:''}`],['Dates',stayDates(d)],['Budget',d.budget?`£${Number(d.budget).toLocaleString('en-GB')} · ${d.budgetBasis.toLowerCase()}`:'To be discussed'],['Needs',d.needs.join(', ')||'To be discussed']];
 for(const [label,value]of items){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;summary.append(dt,dd);}
}
function buildBrief(d){return `Hello PCCO Stays,\n\nPlease help me source accommodation for the following requirement.\n\nSTAY REQUIREMENTS\nPurpose: ${d.service}\nLocation / worksite: ${d.location}\nDates: ${stayDates(d)}\nGuests: ${d.guests}\nProperties / units: ${d.units||'Open to advice'}\nBedrooms per property: ${d.bedrooms}\nBed setup: ${d.beds}\nPreferred distance: ${d.distance}\nSplit across properties: ${d.split}\nTarget budget: ${d.budget?'£'+d.budget+' — '+d.budgetBasis:'To be discussed'}\nPractical requirements: ${d.needs.join(', ')||'None specified'}\nCleaning: ${d.cleaning}\nOptions needed: ${d.urgency}\n${d.notes?'Additional details: '+d.notes+'\n':''}\nCONTACT DETAILS\nName: ${d.name}\n${d.company?'Company: '+d.company+'\n':''}Email: ${d.email}\n${d.phone?'Phone: '+d.phone+'\n':''}${d.reference?'Reference: '+d.reference+'\n':''}\nI agree that PCCO may use these details to respond to this accommodation enquiry.\nPlease confirm suitable options, full costs and booking terms.\n\nThank you,\n${d.name}`;}
form.addEventListener('submit',async e=>{
 e.preventDefault();
 if(currentStep<3){if(validStep(currentStep))showStep(currentStep+1);return;}
 for(let s=1;s<=3;s++){if(!validStep(s)){const message=error.textContent;const invalid=form.querySelector('[aria-invalid=true]');showStep(s);fail(message,invalid);return;}}
 if(form.dataset.submitting==='true')return;
 const d=getData();lastBrief=buildBrief(d);
 const payload={enquiry_type:'need_accommodation',full_name:d.name,company:d.company,email:d.email,phone:d.phone,location_required:d.location,check_in_date:d.flexible?null:d.arrival,stay_length:stayDates(d).slice(0,120),guest_count:Number(d.guests),unit_count:d.units?Number(d.units):null,bedrooms_required:d.bedrooms,parking_required:d.needs.filter(n=>/parking/i.test(n)).join(', ')||'Not specified',pets:d.needs.includes('Pets considered')?'Please consider pets':'Not specified',budget:d.budget?'£'+d.budget+' — '+d.budgetBasis:'To be discussed',details:lastBrief.slice(0,3000),website:d.website||''};
 const submit=form.querySelector('[type="submit"]');
 form.dataset.submitting='true';submit.disabled=true;submit.textContent='Sending enquiry…';form.setAttribute('aria-busy','true');
 try{
  const response=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-accommodation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
  const result=await response.json();
  if(!response.ok||!result.ok)throw new Error('Submission not confirmed');
 }catch(e){
  fail('We could not confirm delivery. Your details are still here. Please use WhatsApp or call +44 7411 251361 before sending again.');
  return;
 }finally{form.dataset.submitting='false';submit.disabled=false;submit.innerHTML='Send enquiry <span aria-hidden="true">→</span>';form.removeAttribute('aria-busy');}

 $('#brief-text').textContent=lastBrief;
 $('#send-email').href=`mailto:thepropertycarecouk@gmail.com?subject=${encodeURIComponent(`PCCO Stays enquiry — ${d.location} — ${d.guests} guests`)}&body=${encodeURIComponent(lastBrief)}`;
 $('#send-whatsapp').href=`https://wa.me/447411251361?text=${encodeURIComponent(lastBrief)}`;
 form.hidden=true;$('.steps').hidden=true;$('#step-count').textContent='Enquiry received';$('#send-panel').hidden=false;$('#send-panel').focus({preventScroll:true});$('.enquiry-panel').scrollIntoView({behavior:'smooth',block:'start'});
});
$('#edit-brief').hidden=true;
$('#copy-brief').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lastBrief);$('#copy-status').textContent='Brief copied. Paste it into your email or message.';}catch{const field=document.createElement('textarea');field.value=lastBrief;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();$('#copy-status').textContent=ok?'Brief copied. Paste it into your email or message.':'Copy was unavailable. Download the brief or select the text under “View your full brief”.';}});
$('#download-brief').addEventListener('click',()=>{const blob=new Blob([lastBrief],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='PCCO-Stays-Accommodation-Brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#copy-status').textContent='Your brief download is ready.';});
const whatsToggle=$('#whatsapp-toggle'),whatsPanel=$('#whatsapp-panel');
function closeWhatsApp(){whatsPanel.hidden=true;whatsToggle.setAttribute('aria-expanded','false');}
whatsToggle.addEventListener('click',()=>{const open=whatsPanel.hidden;whatsPanel.hidden=!open;whatsToggle.setAttribute('aria-expanded',String(open));if(open)$('#whatsapp-close').focus();});
$('#whatsapp-close').addEventListener('click',()=>{closeWhatsApp();whatsToggle.focus();});
document.addEventListener('click',e=>{if(!whatsPanel.hidden&&!whatsPanel.contains(e.target)&&!whatsToggle.contains(e.target))closeWhatsApp();if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menu.contains(e.target))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!whatsPanel.hidden){closeWhatsApp();whatsToggle.focus();}closeMenu();}});
const dialog=$('#privacy-dialog');
document.querySelectorAll('.privacy-open').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));
$('#privacy-close').addEventListener('click',()=>dialog.close());$('#privacy-done').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
configureDates();

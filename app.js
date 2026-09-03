const API='https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-public';let service='deep',leadToken=new URLSearchParams(location.search).get('lead')||'',estimateData=null,selectedDate='',selectedTime='',availabilityData=[];const $=id=>document.getElementById(id);document.querySelectorAll('.service').forEach(b=>b.onclick=()=>{service=b.dataset.service;document.querySelectorAll('.service').forEach(x=>x.classList.toggle('active',x===b));['monthly','deep','regular','carpet','airbnb'].forEach(s=>$(s+'Fields').style.display=s===service?'block':'none');const monthly=service==='monthly';document.querySelector('.gate').style.display=monthly?'none':'';document.querySelector('.estGrid').classList.toggle('monthlyMode',monthly);if(monthly){$('estimateResult').classList.remove('show');renderMonthly()}});$('menu').onclick=()=>$('mobile').classList.toggle('show');document.querySelectorAll('#mobile a').forEach(a=>a.onclick=()=>$('mobile').classList.remove('show'));function payload(){const base={action:'create_estimate',service,full_name:$('name').value.trim(),phone:$('phone').value.trim(),email:$('email').value.trim(),postcode:$('postcode').value.trim(),website:$('website').value.trim(),marketing_consent:$('marketingConsent').checked};if(service==='deep')Object.assign(base,{configuration_code:$('deepConfig').value,condition_code:$('deepCondition').value});if(service==='regular')Object.assign(base,{configuration_code:$('regularConfig').value,extras:[...document.querySelectorAll('.regExtra:checked')].map(x=>x.value)});if(service==='carpet')Object.assign(base,{bedrooms:Number($('carpetBeds').value),living_room:$('living').value,stairs:$('stairs').value==='1',upholstery:$('upholstery').value});if(service==='airbnb')Object.assign(base,{configuration_code:$('airbnbConfig').value,linen_required:$('linenRequired').value,host_type:$('hostType').value,portfolio_size:$('portfolioSize').value,frequency:$('frequency').value,cleaner_status:$('cleanerStatus').value});return base}async function api(body){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({ok:false,error:'Unexpected server response'}));if(!r.ok||d.ok===false)throw new Error(d.error||'Something went wrong');return d}function showError(el,msg){el.textContent=msg;el.classList.add('show')}function clearError(el){el.classList.remove('show');el.textContent=''}$('estimateBtn').onclick=async()=>{clearError($('formError'));$('estimateBtn').classList.add('loading');try{const d=await api(payload());leadToken=d.token;estimateData=d;$('price').textContent=d.estimate.display;$('resultMeta').textContent=`${d.service_name} · ${d.configuration_label||'Property details supplied'} · estimate only`;$('breakdown').innerHTML='<b style="color:#082d69">Estimate breakdown</b>'+((d.breakdown||[]).length?(d.breakdown||[]).map(r=>`<div class="breakrow"><span>${r.label}</span><b>${r.amount!=null?'£'+Number(r.amount).toFixed(Number(r.amount)%1?2:0):r.min!=null?'£'+r.min+'–£'+r.max:''}</b></div>`).join(''):'<div class="breakrow"><span>Tailored estimate</span><b>We’ll confirm details</b></div>');$('estimateResult').classList.add('show');$('sumService').textContent=d.service_name;$('sumEstimate').textContent=d.estimate.display;await unlockBooking();$('estimateResult').scrollIntoView({behavior:'smooth',block:'start'})}catch(e){showError($('formError'),e.message)}finally{$('estimateBtn').classList.remove('loading')}};async function unlockBooking(){$('bookingReveal').classList.add('show');$('bookingLead').textContent='Choose a preferred appointment. We’ll confirm it after checking the team rota.';try{const d=await api({action:'availability'});availabilityData=d.dates||[];renderDates()}catch(e){showError($('bookingError'),'Could not load live availability. Please try again shortly.')}}function renderDates(){$('dates').innerHTML='';availabilityData.forEach(d=>{const date=new Date(d.date+'T12:00:00'),b=document.createElement('button');b.className='date';b.innerHTML=`${date.toLocaleDateString('en-GB',{weekday:'short'})}<span>${date.getDate()} ${date.toLocaleDateString('en-GB',{month:'short'})}</span>`;b.onclick=()=>{document.querySelectorAll('.date').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedDate=d.date;selectedTime='';$('sumDate').textContent=date.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});$('sumTime').textContent='Choose a time';renderSlots(d.slots)};$('dates').appendChild(b)})}function renderSlots(slots){$('slots').innerHTML='';(slots||[]).forEach(s=>{const b=document.createElement('button');b.className='slot '+s.status;const h=Number(s.time.slice(0,2));b.textContent=`${h===12?12:h>12?h-12:h}:00${h<12?'am':'pm'}`;if(s.status==='unavailable')b.disabled=true;else b.onclick=()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedTime=s.time;$('sumTime').textContent=b.textContent};$('slots').appendChild(b)})}$('requestBtn').onclick=async()=>{clearError($('bookingError'));if(!leadToken)return showError($('bookingError'),'Please complete your estimate first.');if(!selectedDate||!selectedTime)return showError($('bookingError'),'Please choose a preferred date and time.');$('requestBtn').classList.add('loading');try{await api({action:'request_booking',token:leadToken,date:selectedDate,time:selectedTime});$('success').classList.add('show');$('requestBtn').disabled=true;$('requestBtn').textContent='Request received ✓'}catch(e){showError($('bookingError'),e.message)}finally{$('requestBtn').classList.remove('loading')}};if(leadToken){$('bookingReveal').classList.add('show');$('bookingLead').textContent='Your estimate reference is recognised. Choose a preferred appointment below.';$('sumService').textContent='Your saved estimate';$('sumEstimate').textContent='See estimate email';unlockBooking();setTimeout(()=>location.hash==='booking'&&$('booking').scrollIntoView({behavior:'smooth'}),250)}
const monthlyPackages={
 studio_1b:{label:'Studio / 1 bathroom',tier:'small',deep:[100,120]},
 '1bed_1bath':{label:'1 bed / 1 bathroom',tier:'small',deep:[110,130]},
 '1bed_2bath':{label:'1 bed / 2 bathrooms',tier:'small',deep:[130,150]},
 '2bed_1bath':{label:'2 bed / 1 bathroom',tier:'small',deep:[160,180]},
 '2bed_2bath':{label:'2 bed / 2 bathrooms',tier:'small',deep:[180,200]},
 '3bed_1bath':{label:'3 bed / 1 bathroom',tier:'three',deep:[210,230]},
 '3bed_2bath':{label:'3 bed / 2 bathrooms',tier:'three',deep:[230,250]},
 '3bed_3bath':{label:'3 bed / 3 bathrooms',tier:'three',deep:[250,270]},
 '4bed_1bath':{label:'4 bed / 1 bathroom',tier:'four',deep:[260,280]},
 '4bed_2bath':{label:'4 bed / 2 bathrooms',tier:'four',deep:[280,300]},
 '4bed_3bath':{label:'4 bed / 3 bathrooms',tier:'four',deep:[310,330]},
 '4bed_4bath':{label:'4 bed / 4 bathrooms',tier:'four',deep:[340,360]}
};
const monthlyPrices={
 small:{essential:139,regular:259,plus:319},
 three:{essential:219,regular:399,plus:449},
 four:{essential:249,regular:489,plus:569}
};
function renderMonthly(){
 const cfg=$('monthlyConfig'),target=$('monthlyComparison');if(!cfg||!target)return;
 if(cfg.value==='5plus'){
  target.innerHTML='<div class="bespokePkg"><h4>5+ bedroom home</h4><p>For larger homes we prepare a personalised monthly package around the size and cleaning requirements.</p><a class="btn" target="_blank" href="https://wa.me/447411251361?text=Hi%20The%20Property%20Care%20Co.%2C%20I%27d%20like%20a%20monthly%20cleaning%20package%20quote%20for%20a%205%2B%20bedroom%20home.">Request a personalised quote</a></div>';return;
 }
 const info=monthlyPackages[cfg.value]||monthlyPackages['2bed_2bath'],p=monthlyPrices[info.tier];
 const extrasMin=info.deep[0]+20,extrasMax=info.deep[1]+20;
 const enc=s=>encodeURIComponent(s);
 const wa=(plan,price)=>'https://wa.me/447411251361?text='+enc('Hi The Property Care Co., I am interested in the '+plan+' monthly cleaning package for my '+info.label+' at £'+price+' per month. Please can you help me get started?');
 target.innerHTML='<div class="packageWrap"><div class="packageScroll"><table class="packageTable"><thead><tr><th class="feature">What’s included</th><th><span class="planName">Essential</span><span class="planPrice">£'+p.essential+'<small>/month</small></span><span class="planSub">2 scheduled cleans</span></th><th class="popular"><span class="packageBadge">MOST POPULAR</span><span class="planName">Regular</span><span class="planPrice">£'+p.regular+'<small>/month</small></span><span class="planSub">4 scheduled cleans</span></th><th class="plusHead"><span class="packageBadge">BEST VALUE</span><span class="planName">Plus</span><span class="planPrice">£'+p.plus+'<small>/month</small></span><span class="planSub">3 regular + 1 deep clean</span></th></tr></thead><tbody>'+
 '<tr><td class="feature">Scheduled cleans</td><td>2 / month</td><td>4 / month</td><td>4 / month</td></tr>'+
 '<tr><td class="feature">Kitchen & bathroom cleaning</td><td class="pkgCheck">✓</td><td class="pkgCheck">✓</td><td class="pkgPlusCheck">✓</td></tr>'+
 '<tr><td class="feature">Dusting, vacuuming & mopping</td><td class="pkgCheck">✓</td><td class="pkgCheck">✓</td><td class="pkgPlusCheck">✓</td></tr>'+
 '<tr><td class="feature">Fridge clean</td><td class="pkgCheck">✓</td><td class="pkgCheck">✓</td><td class="pkgPlusCheck">✓</td></tr>'+
 '<tr><td class="feature">Dishwasher clean</td><td class="pkgDash">—</td><td class="pkgDash">—</td><td class="pkgPlusCheck">✓</td></tr>'+
 '<tr><td class="feature">Monthly deep clean</td><td class="pkgDash">—</td><td class="pkgDash">—</td><td><span class="pkgPlusCheck">✓</span><br><small>Worth £'+info.deep[0]+'–£'+info.deep[1]+'</small></td></tr>'+
 '<tr><td class="feature">25% off carpet cleaning</td><td class="pkgDash">—</td><td class="pkgDash">—</td><td class="pkgPlusCheck">✓</td></tr>'+
 '<tr><td class="feature">25% off upholstery cleaning</td><td class="pkgDash">—</td><td class="pkgDash">—</td><td class="pkgPlusCheck">✓</td></tr>'+
 '</tbody></table></div><div class="packageValue"><b>Plus includes £'+extrasMin+'–£'+extrasMax+' of included cleaning extras each month</b><span>That value covers the monthly deep clean, fridge clean and dishwasher clean. Plus members also receive 25% off carpet and upholstery cleaning whenever those services are booked.</span></div>'+
 '<div class="packageActions"><a class="packageAction" target="_blank" href="'+wa('Essential',p.essential)+'">Choose Essential</a><a class="packageAction popular" target="_blank" href="'+wa('Regular',p.regular)+'">Choose Regular</a><a class="packageAction plus" target="_blank" href="'+wa('Plus',p.plus)+'">Choose Plus</a></div>'+
 '<div class="packageFoot">Online recurring payment will be added separately. The existing one-off estimate, appointment and payment process has not been changed.</div></div>';
}
$('monthlyConfig')&&$('monthlyConfig').addEventListener('change',renderMonthly);renderMonthly();
;$('monthlyHeroBtn')&&($('monthlyHeroBtn').onclick=()=>{const b=document.querySelector('.service[data-service="monthly"]');if(b)b.click();});
// Airbnb package comparison extension
const airbnbPackagePrices={
 studio:{clean:60,linen:80,all:90},
 '1bed_1bath':{clean:65,linen:85,all:95},
 '2bed_1bath':{clean:75,linen:100,all:110},
 '2bed_2bath':{clean:80,linen:105,all:120},
 '3bed_1bath':{clean:90,linen:120,all:158},
 '3bed_2plus':{clean:95,linen:125,all:165},
 '4bed_1bath':{clean:115,linen:155,all:178},
 '4bed_2plus':{clean:120,linen:160,all:185}
};

let airbnbPackageChoice='';

function airbnbMoney(n){
 return '£'+Number(n).toFixed(Number(n)%1?2:0);
}

function airbnbField(id){
 const el=$(id);
 return el?el.closest('.field'):null;
}

function setAirbnbPackage(value){
 airbnbPackageChoice=value;

 const linen=$('linenRequired');
 if(linen) linen.value=value;

 document.querySelectorAll('.airbnbPkgBtn').forEach(btn=>{
  const chosen=btn.dataset.value===value;
  btn.classList.toggle('selected',chosen);
  btn.textContent=chosen?'Selected ✓':btn.dataset.label;
 });
}

function renderAirbnbPackages(){
 const cfg=$('airbnbConfig');
 const target=$('airbnbPackageComparison');

 if(!cfg||!target)return;

 const p=airbnbPackagePrices[cfg.value];

 if(!p){
  target.innerHTML='<div class="monthlyNote">Choose your property size above to compare the Airbnb turnover packages.</div>';
  return;
 }

 target.innerHTML=
 '<div class="packageWrap">'+
 '<div class="packageScroll">'+
 '<table class="packageTable">'+
 '<thead>'+
 '<tr>'+
 '<th class="feature">What’s included</th>'+

 '<th>'+
 '<span class="planName">Clean Only</span>'+
 '<span class="planPrice">'+airbnbMoney(p.clean)+'</span>'+
 '<span class="planSub">Per turnover</span>'+
 '</th>'+

 '<th class="popular">'+
 '<span class="planName">Clean + Host Linen</span>'+
 '<span class="planPrice">'+airbnbMoney(p.linen)+'</span>'+
 '<span class="planSub">We wash, dry & place your linen</span>'+
 '</th>'+

 '<th class="plusHead">'+
 '<span class="packageBadge">ALL-INCLUSIVE</span>'+
 '<span class="planName">All-Inclusive</span>'+
 '<span class="planPrice">'+airbnbMoney(p.all)+'</span>'+
 '<span class="planSub">Cleaning, linen, laundry & consumables</span>'+
 '</th>'+
 '</tr>'+
 '</thead>'+

 '<tbody>'+

 '<tr>'+
 '<td class="feature">Guest-ready turnover clean</td>'+
 '<td class="pkgCheck">✓</td>'+
 '<td class="pkgCheck">✓</td>'+
 '<td class="pkgPlusCheck">✓</td>'+
 '</tr>'+

 '<tr>'+
 '<td class="feature">Wash & dry host’s own linen</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgCheck">✓</td>'+
 '<td class="pkgDash">—</td>'+
 '</tr>'+

 '<tr>'+
 '<td class="feature">Fresh linen placed ready for guests</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgCheck">✓</td>'+
 '<td class="pkgPlusCheck">✓</td>'+
 '</tr>'+

 '<tr>'+
 '<td class="feature">Linen supplied by The Property Care Co.</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgPlusCheck">✓</td>'+
 '</tr>'+

 '<tr>'+
 '<td class="feature">Laundry handled between stays</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgPlusCheck">✓</td>'+
 '</tr>'+

 '<tr>'+
 '<td class="feature">Standard guest consumables replenished</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgDash">—</td>'+
 '<td class="pkgPlusCheck">✓</td>'+
 '</tr>'+

 '</tbody>'+
 '</table>'+
 '</div>'+

 '<div class="packageValue">'+
 '<b>All-Inclusive includes</b>'+
 '<span>✓ Full turnover clean &nbsp; ✓ Linen supplied by The Property Care Co. &nbsp; ✓ Laundry handled between stays &nbsp; ✓ Fresh linen placed ready for guests &nbsp; ✓ Standard guest consumables replenished</span>'+
 '</div>'+

 '<div class="packageActions">'+

 '<button type="button" class="packageAction airbnbPkgBtn" data-value="no" data-label="Choose Clean Only">'+
 'Choose Clean Only'+
 '</button>'+

 '<button type="button" class="packageAction popular airbnbPkgBtn" data-value="yes" data-label="Choose Clean + Host Linen">'+
 'Choose Clean + Host Linen'+
 '</button>'+

 '<button type="button" class="packageAction plus airbnbPkgBtn" data-value="all_inclusive" data-label="Choose All-Inclusive">'+
 'Choose All-Inclusive'+
 '</button>'+

 '</div>'+

 '<div class="packageFoot">'+
 '<b>Estimate only.</b> Prices shown are indicative and are not the final confirmed price. Your final price will be confirmed once we have reviewed your property details and requirements.'+
 '</div>'+
 '</div>';

 document.querySelectorAll('.airbnbPkgBtn').forEach(btn=>{
  btn.onclick=()=>setAirbnbPackage(btn.dataset.value);
 });

 if(airbnbPackageChoice){
  setAirbnbPackage(airbnbPackageChoice);
 }
}

function tidyAirbnbLabels(){

 const airbnb=$('airbnbFields');
 if(!airbnb)return;

 const linen=$('linenRequired');

 if(linen){
  if(![...linen.options].some(o=>o.value==='all_inclusive')){
   linen.add(new Option('All-Inclusive','all_inclusive'));
  }

  linen.value='';
 }

 const linenField=airbnbField('linenRequired');

 if(linenField){
  linenField.style.display='none';
 }

 airbnb.querySelectorAll('*').forEach(el=>{
  if(el.childNodes.length===1&&el.firstChild?.nodeType===3){
   el.textContent=el.textContent
    .replace(/PCCO All-Inclusive/gi,'All-Inclusive')
    .replace(/\bPCCO\b/gi,'The Property Care Co.');
  }
 });

 [
  ['hostType','2'],
  ['portfolioSize','3'],
  ['frequency','4'],
  ['cleanerStatus','5']
 ].forEach(([id,n])=>{

  const field=airbnbField(id);
  const label=field?.querySelector('label');

  if(label){
   label.textContent=label.textContent.replace(/^\s*\d+\.\s*/,n+'. ');
  }
 });

 let target=$('airbnbPackageComparison');

 if(!target){
  target=document.createElement('div');
  target.id='airbnbPackageComparison';

  airbnbField('airbnbConfig')
   ?.insertAdjacentElement('afterend',target);
 }

 const oldPrices=airbnb.querySelector('.airbnbPrices');

 if(oldPrices){
  oldPrices.style.display='none';
 }

 const note=airbnb.querySelector('.linenNote');

 if(note){
  note.innerHTML=
   '<b>Choose one of the three turnover packages below.</b> All-Inclusive includes linen supplied by us, laundry between stays and standard guest consumables.';
 }

 renderAirbnbPackages();

 $('airbnbConfig')
  ?.addEventListener('change',renderAirbnbPackages);

 const style=document.createElement('style');

 style.textContent=
 '.airbnbPkgBtn{cursor:pointer}'+
 '.airbnbPkgBtn.selected{box-shadow:inset 0 0 0 2px #0a74f5;outline:3px solid rgba(10,116,245,.15)}'+
 '.airbnbPkgBtn.plus.selected{box-shadow:inset 0 0 0 2px #25a55f;outline-color:rgba(37,165,95,.18)}';

 document.head.appendChild(style);
}

const originalEstimateClick=$('estimateBtn').onclick;

$('estimateBtn').onclick=async function(e){

 if(service==='airbnb'&&!airbnbPackageChoice){

  clearError($('formError'));

  showError(
   $('formError'),
   'Please choose an Airbnb turnover package before unlocking your estimate.'
  );

  $('airbnbPackageComparison')
   ?.scrollIntoView({
    behavior:'smooth',
    block:'center'
   });

  return;
 }

 return originalEstimateClick.call(this,e);
};

const estimateObserver=new MutationObserver(()=>{

 if(service!=='airbnb')return;

 const result=$('estimateResult');

 if(!result)return;

 result.querySelectorAll('*').forEach(el=>{

  if(el.childNodes.length===1&&el.firstChild?.nodeType===3){

   el.textContent=el.textContent
    .replace(/PCCO All-Inclusive/gi,'All-Inclusive')
    .replace(
     /PCCO-supplied linen/gi,
     'Linen supplied by The Property Care Co.'
    )
    .replace(/\bPCCO\b/gi,'The Property Care Co.');
  }
 });
});

if($('estimateResult')){
 estimateObserver.observe(
  $('estimateResult'),
  {
   childList:true,
   subtree:true,
   characterData:true
  }
 );
}

tidyAirbnbLabels();
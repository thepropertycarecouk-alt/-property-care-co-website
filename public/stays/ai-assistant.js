/* PCCO Stays AI Booking Assistant (preview-only until approved).
   Real conversational intelligence: /api/stays-ai → server-side language model.
   Preview test submissions use PCCO's existing accommodation enquiry endpoint only after visitor consent. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const PREVIEW = params.get('ai_preview') === '1';
  if (!PREVIEW) return;
  const css = `
    .pcco-ai-launch{position:fixed;left:18px;bottom:18px;z-index:9990;display:flex;align-items:center;gap:9px;padding:12px 17px;border:1px solid #c99e51;border-radius:50px;background:#021b3c;color:#fff;box-shadow:0 8px 30px #01152c50;font:600 14px Arial,sans-serif;cursor:pointer}
    .pcco-ai-launch:hover{background:#123456}.pcco-ai-launch:focus-visible,.pcco-ai-panel :focus-visible{outline:3px solid #c99e51;outline-offset:3px}
    .pcco-ai-panel{position:fixed;left:18px;bottom:79px;width:min(410px,calc(100vw - 32px));height:min(670px,calc(100dvh - 112px));z-index:9991;border:1px solid #c8d0d4;border-radius:15px;background:#fff;box-shadow:0 18px 55px #01152c45;overflow:hidden;display:flex;flex-direction:column;color:#172e3d;font:14px/1.5 Arial,sans-serif}
    .pcco-ai-panel[hidden],.pcco-ai-actions[hidden],.pcco-ai-send[hidden],.pcco-ai-messages[hidden]{display:none!important}.pcco-ai-header{padding:15px 16px;background:#021b3c;color:#fff;display:flex;align-items:center;gap:10px}
    .pcco-ai-header strong{font:600 16px Arial,sans-serif}.pcco-ai-header small{display:block;color:#e3d1b4;font-size:11px}.pcco-ai-header button{margin-left:auto;color:white;border:0;background:none;font-size:25px;cursor:pointer;line-height:1}
    .pcco-ai-preview{padding:7px 14px;background:#fbf1da;font-size:11px;color:#654b23;border-bottom:1px solid #e4d6b4}
    .pcco-ai-messages{padding:16px 14px;flex:1;overflow:auto;display:flex;flex-direction:column;gap:10px;background:#fbfaf7}
    .pcco-ai-bubble{padding:11px 13px;border-radius:12px;max-width:87%;white-space:pre-wrap;word-break:break-word}
    .pcco-ai-bubble.assistant{background:#fff;border:1px solid #e5e7eb;align-self:flex-start}.pcco-ai-bubble.user{background:#e7eef6;align-self:flex-end}
    .pcco-ai-match-note{font-size:12px;line-height:1.5;color:#5d6672;border:1px solid #eee3cc;border-radius:9px;background:#fff9eb;padding:10px 12px;align-self:stretch}.pcco-ai-match-list{display:flex;flex-direction:column;gap:10px;width:100%}.pcco-ai-match-card{display:flex;gap:10px;padding:9px;background:white;border:1px solid #e1e5e9;border-radius:10px;max-width:100%}.pcco-ai-match-card img{width:88px;height:90px;object-fit:cover;border-radius:7px;flex:none}.pcco-ai-match-card-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}.pcco-ai-match-card strong{font-size:13px;line-height:1.35}.pcco-ai-match-card small{font-size:11px;color:#536577;line-height:1.4}.pcco-ai-match-card a{font-size:12px;color:#06457a;text-decoration:underline}.pcco-ai-match-card button{margin-top:4px;padding:6px 9px;border-radius:7px;background:#fff;border:1px solid #c9a563;color:#021b3c;font:600 11px Arial,sans-serif;cursor:pointer}.pcco-ai-match-card button[aria-pressed=true]{background:#eaf1e1;border-color:#779c63}.pcco-ai-preview-warning{grid-column:1/-1;background:#fff5d9;padding:9px;border-radius:7px;color:#5c4521;font-size:12px}.pcco-ai-feedback{grid-column:1/-1;font-size:12px}.pcco-ai-inline-review{align-self:flex-start;background:#021b3c;color:white;border:1px solid #c99e51;border-radius:9px;padding:10px 14px;font:600 13px Arial,sans-serif;cursor:pointer}.pcco-ai-inline-review:hover{background:#123456}
    .pcco-ai-actions{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid #eee}
    .pcco-ai-actions button{font-size:12px;color:#021b3c;background:#fff;border:1px solid #d5c49e;border-radius:18px;padding:7px 10px;cursor:pointer}
    .pcco-ai-send{padding:12px;background:white;border-top:1px solid #e4e4e4;display:flex;gap:7px}
    .pcco-ai-send textarea{flex:1;resize:none;min-height:42px;max-height:100px;border:1px solid #c9ced4;border-radius:9px;padding:9px;font:14px Arial,sans-serif;line-height:1.4}
    .pcco-ai-send button,.pcco-ai-submit{background:#021b3c;color:white;border:0;border-radius:9px;padding:9px 13px;font:600 13px Arial,sans-serif;cursor:pointer}
    .pcco-ai-send button:disabled,.pcco-ai-submit:disabled{opacity:.55;cursor:default}
    .pcco-ai-foot{font-size:10px;padding:8px 13px;color:#5e6875;background:white;line-height:1.4}
    .pcco-ai-review{overflow:auto;flex:1;background:#fbfaf7;padding:13px;display:grid;grid-template-columns:1fr 1fr;gap:9px;align-content:start}
    .pcco-ai-review[hidden]{display:none}.pcco-ai-review h3,.pcco-ai-review p,.pcco-ai-wide{grid-column:1/-1}
    .pcco-ai-review h3{font:600 17px Arial;margin:0}.pcco-ai-review p{font-size:12px;margin:0 0 6px}
    .pcco-ai-review label{font-size:12px;font-weight:600;display:flex;flex-direction:column;gap:4px}
    .pcco-ai-review input{padding:9px 8px;border:1px solid #c9ced4;border-radius:7px;width:100%;background:white;font:13px Arial}
    .pcco-ai-review .pcco-ai-check{display:flex;flex-direction:row;align-items:flex-start;font-weight:400}
    .pcco-ai-check input{width:auto;margin-top:3px}.pcco-ai-review .pcco-ai-submit{grid-column:1/-1}
    .pcco-ai-error{grid-column:1/-1;color:#99332d;font-size:12px}
    @media(max-width:640px){.pcco-ai-launch{left:10px;bottom:10px;padding:11px 14px}.pcco-ai-panel{left:8px;bottom:63px;width:calc(100vw - 16px);height:min(640px,calc(100dvh - 76px))}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  const launch=document.createElement('button');
  launch.type='button';launch.className='pcco-ai-launch';launch.setAttribute('aria-label','Open PCCO AI Booking Assistant');
  launch.setAttribute('aria-expanded','false');launch.textContent='✦ Ask PCCO AI';
  const panel=document.createElement('section');panel.className='pcco-ai-panel';panel.hidden=true;panel.setAttribute('aria-label','PCCO AI Booking Assistant');
  panel.innerHTML=`
    <div class="pcco-ai-header"><span aria-hidden="true" style="font-size:23px">✦</span><div><strong>PCCO Stays Assistant</strong><small>AI-powered booking enquiries</small></div><button type="button" class="pcco-ai-close" aria-label="Close assistant">×</button></div>
    <div class="pcco-ai-preview">Private test — property availability unconfirmed. Only pressing Send Enquiry submits a real enquiry.</div>
    <div class="pcco-ai-messages" aria-live="polite" aria-relevant="additions text"></div>
    <div class="pcco-ai-actions"><button type="button" data-ask="We need contractor accommodation.">Contractors</button><button type="button" data-ask="I'm looking for family or relocation accommodation.">Family / relocation</button><button type="button" data-ask="I need accommodation for a work trip.">Corporate stay</button><button type="button" class="pcco-ai-properties-open">Find properties</button><button type="button" class="pcco-ai-review-open">Review &amp; confirm</button></div>
    <form class="pcco-ai-send"><textarea rows="2" maxlength="1500" aria-label="Message the PCCO AI Assistant" placeholder="Tell me where and when you need to stay…" required></textarea><button type="submit">Send</button></form>
    <form class="pcco-ai-review" hidden><h3>Review &amp; confirm your enquiry</h3><p>Your chat has pre-filled these details. Check or correct them, then send directly to PCCO. Prices, suitability and availability will be confirmed separately.</p><p class="pcco-ai-preview-warning">PRIVATE TEST: Clicking Send Enquiry will send a genuine enquiry to stays@thepropertycareco.co.uk. Please use test contact details you control.</p><p class="pcco-ai-wide pcco-ai-selected-summary" hidden></p>
      <label>Full name *<input name="name" maxlength="100" autocomplete="name" required></label>
      <label>Email *<input type="email" name="email" maxlength="160" autocomplete="email" required></label>
      <label>Phone *<input type="tel" name="phone" maxlength="40" autocomplete="tel" required></label>
      <label>Location *<input name="location" maxlength="300" required></label>
      <label>Stay purpose<input name="purpose" maxlength="120"></label>
      <label>Arrival<input name="arrival" maxlength="70" placeholder="Exact or approximate"></label>
      <label>Checkout<input name="departure" maxlength="70"></label>
      <label>Duration<input name="duration" maxlength="100"></label>
      <label>Guests<input name="guests" maxlength="30"></label>
      <label>Bedrooms<input name="bedrooms" maxlength="70"></label>
      <label>Separate beds<input name="beds" maxlength="100"></label>
      <label>Parking<input name="parking" maxlength="100"></label>
      <label>Budget<input name="budget" maxlength="120"></label>
      <label class="pcco-ai-wide">Additional requirements<input name="notes" maxlength="250"></label>
      <label class="pcco-ai-check pcco-ai-wide"><input type="checkbox" name="consent" required> <span>I agree that PCCO may use the details I provide to respond to my enquiry. I understand AI processes chat messages and no booking is confirmed by this chat.</span></label>
      <div class="pcco-ai-error" role="alert" hidden></div>
      <button type="button" class="pcco-ai-back pcco-ai-wide">← Back to chat</button>
      <div class="pcco-ai-feedback" role="status" hidden></div><button type="submit" class="pcco-ai-submit">Send Enquiry</button>
    </form>
    <div class="pcco-ai-foot">You are chatting with AI. Replies may be inaccurate; do not share sensitive information. For urgent help call <a href="tel:+447411251361" style="text-decoration:underline">07411 251361</a>. <a href="#enquire" class="pcco-ai-existing" style="text-decoration:underline">Use standard enquiry form</a>.</div>
  `;
  document.body.append(launch,panel);
  const $=selector=>panel.querySelector(selector);
  const messages=$('.pcco-ai-messages'),typing=$('.pcco-ai-send textarea'),send=$('.pcco-ai-send button');
  const review=$('.pcco-ai-review'),chat=$('.pcco-ai-send'),actions=$('.pcco-ai-actions');
  const history=[];let latestLead={},working=false,propertyBusy=false,submitted=false;
  const selectedProperties=new Map();
  const autoSearchedLocations=new Set();
  const PROPERTY_FEED='https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1';
  const ENQUIRY_ENDPOINT='https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-accommodation';
  let propertyListPromise=null;
  const listedProperties=()=>{
    if(!propertyListPromise)propertyListPromise=fetch(PROPERTY_FEED,{cache:'no-store',signal:AbortSignal.timeout(14000)})
      .then(response=>{if(!response.ok)throw new Error('Property feed unavailable');return response.json();})
      .then(rows=>Array.isArray(rows)?rows.filter(p=>p&&p.published&&p.slug&&p.name):[])
      .catch(err=>{propertyListPromise=null;throw err;});
    return propertyListPromise;
  };
  function selectedSummary(){
    const box=$('.pcco-ai-selected-summary');
    if(!selectedProperties.size){box.hidden=true;box.textContent='';return;}
    box.hidden=false;box.textContent='Properties selected for enquiry: '+[...selectedProperties.values()].map(p=>p.name).join('; ');
  }
  function showStatus(text){return bubble('assistant',text);}
  const parsedCount=value=>{const n=Number(String(value||'').match(/\d+/)?.[0]);return Number.isInteger(n)&&n>0&&n<=5000?n:null;};
  const hasParking=p=>{const cat=String(p.parking_category||'').toLowerCase(),info=String(p.parking||'').toLowerCase();if(cat==='none'||/\b(no parking|parking unavailable|no on-site parking)\b/.test(info))return false;return ['free','paid','parking','yes','available','street','permit','private','driveway','garage','included'].includes(cat)||/\b(parking|driveway|garage|permit)\b/.test(info);};
  
  function bubble(role,text){const node=document.createElement('div');node.className='pcco-ai-bubble '+role;node.textContent=text;messages.append(node);messages.scrollTop=messages.scrollHeight;return node;}
  function offerReview(){
    messages.querySelectorAll('.pcco-ai-inline-review').forEach(node=>node.remove());
    if(!(latestLead.location && (latestLead.arrival||latestLead.departure||latestLead.duration) && (latestLead.email||latestLead.phone)))return;
    const button=document.createElement('button');button.type='button';button.className='pcco-ai-inline-review';
    button.textContent='Review & confirm enquiry →';button.addEventListener('click',openReview);
    messages.append(button);messages.scrollTop=messages.scrollHeight;
  }
  async function showProperties(){
    if(propertyBusy)return;
    const target=String(latestLead.location||'').trim();
    if(!target){showStatus('Tell me which town, city or postcode you need, then I can look for relevant PCCO listings.');return;}
    propertyBusy=true;
    const status=showStatus('Checking the published PCCO listings for '+target+'…');
    try{
      const properties=await listedProperties();
      let candidates=[],distance=new Map(),locationVerified=false;
      const q=target.trim().toLowerCase().replace(/\s+/g,' ');
      try{
        const result=await fetch('/api/location-suggest?q='+encodeURIComponent(target),{signal:AbortSignal.timeout(10000)});
        const obj=await result.json();
        const suggestions=Array.isArray(obj.suggestions)?obj.suggestions:[];
        const chosen=suggestions.find(x=>String(x.label||'').toLowerCase().includes(q))||suggestions[0];
        if(chosen&&Number.isFinite(Number(chosen.lat))&&Number.isFinite(Number(chosen.lon))){
          const uri='/api/postcode-radius?lat='+encodeURIComponent(chosen.lat)+'&lon='+encodeURIComponent(chosen.lon)+'&radius=25';
          const response=await fetch(uri,{signal:AbortSignal.timeout(16000)});
          if(response.ok){
            const nearby=await response.json();
            if(nearby.ok&&Array.isArray(nearby.matches)){
              const matched=new Set(nearby.matches.map(x=>x.slug));
              distance=new Map(nearby.matches.map(x=>[x.slug,x.distance_miles]));
              candidates=properties.filter(p=>matched.has(p.slug));
              locationVerified=true;
            }
          }
        }
      }catch{ /* Only use the precise location search if it succeeds. */ }
      if(!locationVerified){
        const terms=q.split(/[\s,]+/).filter(w=>w.length>2);
        candidates=properties.filter(p=>{
          const city=String(p.city||'').toLowerCase(),postcode=String(p.postcode||'').toLowerCase();
          return city===q||postcode===q||terms.some(term=>term.length>=4&&(city.split(/[\s,]+/).includes(term)||postcode===term));
        });
      }
      const guestCount=parsedCount(latestLead.guests);
      const bedrooms=parsedCount(latestLead.bedrooms);
      const wantsParking=/yes|required|must|need|parking|car|van/i.test(String(latestLead.parking||''))&&!/no parking required|no need|not required/i.test(String(latestLead.parking||''));
      // Exclude only explicitly unavailable parking. Missing parking information stays unverified.
      if(wantsParking)candidates=candidates.filter(p=>hasParking(p)||(!p.parking&&!p.parking_category));
      candidates.sort((a,b)=>{
        const score=p=>(guestCount&&Number(p.sleeps)>=guestCount?8:0)+(bedrooms&&Number(p.bedrooms)>=bedrooms?3:0)+(wantsParking&&hasParking(p)?2:0);
        return score(b)-score(a)||(distance.get(a.slug)??999)-(distance.get(b.slug)??999);
      });
      if(!candidates.length){
        status.textContent='I could not find a suitable published listing around '+target+'. PCCO can still search its wider partner network. Tap Review & confirm to send your full requirements.';
        return;
      }
      const items=candidates.slice(0,4);
      status.textContent='Here are '+items.length+' published PCCO listing'+(items.length===1?'':'s')+' around '+target+' you can explore. These are NOT confirmed available for your dates; PCCO must check the host, bed configuration, parking and price.';
      const list=document.createElement('div');list.className='pcco-ai-match-list';
      for(const p of items){
        const card=document.createElement('div');card.className='pcco-ai-match-card';
        if(p.cover_photo){
          const img=document.createElement('img');
          img.src='/api/property-image?property='+encodeURIComponent(p.slug)+'&size=700'+(p.photo_version?'&v='+encodeURIComponent(p.photo_version):'');
          img.alt=String(p.cover_photo.alt||p.name);img.loading='lazy';
          img.onerror=()=>{img.remove();};
          card.append(img);
        }
        const content=document.createElement('div');content.className='pcco-ai-match-card-body';
        const name=document.createElement('strong');name.textContent=p.name;
        const facts=document.createElement('small');
        const details=[p.city||p.postcode||'UK location',p.bedrooms!=null?(Number(p.bedrooms)===0?'Studio':p.bedrooms+' bedrooms'):null,p.sleeps?'Sleeps '+p.sleeps:null,p.parking?'Parking: '+p.parking:'Parking to confirm'];
        if(distance.has(p.slug))details.push('Approx. '+distance.get(p.slug)+' miles from search area');
        facts.textContent=details.filter(Boolean).join(' · ');
        const link=document.createElement('a');link.href='/properties/'+encodeURIComponent(p.slug)+'/';link.target='_blank';link.rel='noopener noreferrer';link.textContent='View property details';
        const select=document.createElement('button');select.type='button';
        const update=()=>{const chosen=selectedProperties.has(p.slug);select.textContent=chosen?'✓ Selected — remove':'Include in enquiry';select.setAttribute('aria-pressed',String(chosen));selectedSummary();};
        select.addEventListener('click',()=>{if(selectedProperties.has(p.slug))selectedProperties.delete(p.slug);else selectedProperties.set(p.slug,{slug:p.slug,name:p.name});update();});
        content.append(name,facts,link,select);card.append(content);list.append(card);update();
      }
      const note=document.createElement('div');note.className='pcco-ai-match-note';
      note.textContent='Possible matches only — no live calendars are connected. If you need separate beds or multiple homes, the team will verify the layout and source additional options.';
      list.append(note);
      messages.append(list);messages.scrollTop=messages.scrollHeight;
      offerReview();
    }catch{
      status.textContent='The published property search is temporarily unavailable. You can still review and send the accommodation enquiry without any property selection.';
    }finally{propertyBusy=false;}
  }
    bubble('assistant','Welcome to PCCO Stays! I can help with contractor accommodation, business travel, family visits or relocation. Tell me what you need, or ask me anything about our service.');
  function toggle(force){const open=typeof force==='boolean'?force:panel.hidden;panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));if(open)typing.focus();else launch.focus();}
  launch.addEventListener('click',()=>toggle());
  $('.pcco-ai-close').addEventListener('click',()=>toggle(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggle(false)});
  async function talk(text){
    text=text.trim();if(!text||working)return;
    working=true;send.disabled=true;typing.disabled=true;actions.querySelectorAll('button').forEach(b=>b.disabled=true);
    bubble('user',text);history.push({role:'user',content:text});
    const waiting=bubble('assistant','Thinking…');
    try{
      const response=await fetch('/api/stays-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history}),signal:AbortSignal.timeout(25000)});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||'The AI assistant is unavailable.');
      if(typeof payload.reply!=='string')throw new Error('Unexpected AI response');
      waiting.textContent=payload.reply;
      history.push({role:'assistant',content:payload.reply});
      latestLead=payload.lead||{};
      offerReview();
      const locationKey=String(latestLead.location||'').trim().toLowerCase();
      if(locationKey&&!autoSearchedLocations.has(locationKey)){
        autoSearchedLocations.add(locationKey);
        void showProperties();
      }
      // Limit conversation history submitted to the model to control cost and latency.
      if(history.length>22)history.splice(0,history.length-22);
    }catch(err){
      waiting.textContent=(err instanceof Error?err.message:'Connection problem')+' You can also use the standard enquiry form or call PCCO.';
      history.pop();
    }finally{
      working=false;send.disabled=false;typing.disabled=false;actions.querySelectorAll('button').forEach(b=>b.disabled=false);typing.focus();messages.scrollTop=messages.scrollHeight;
    }
  }
  chat.addEventListener('submit',e=>{e.preventDefault();const value=typing.value;typing.value='';talk(value)});
  typing.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(!working)chat.requestSubmit();}});
  actions.querySelectorAll('[data-ask]').forEach(btn=>btn.addEventListener('click',()=>talk(btn.dataset.ask)));
  function openReview(){if(submitted)return;for(const input of review.querySelectorAll('input[name]')){if(input.type!=='checkbox')input.value=latestLead[input.name]||'';}selectedSummary();messages.hidden=true;actions.hidden=true;chat.hidden=true;review.hidden=false;review.querySelector('input[name="name"]').focus();}
  function closeReview(){review.hidden=true;messages.hidden=false;actions.hidden=false;chat.hidden=false;typing.focus();}
  $('.pcco-ai-properties-open').addEventListener('click',()=>void showProperties());
  $('.pcco-ai-review-open').addEventListener('click',openReview);
  $('.pcco-ai-back').addEventListener('click',closeReview);
  review.addEventListener('submit',async e=>{
    e.preventDefault();
    if(submitted||review.dataset.sending==='true')return;
    const values=Object.fromEntries(new FormData(review));
    const feedback=$('.pcco-ai-feedback');
    const submit=$('.pcco-ai-submit');
    const fullName=String(values.name||'').trim(),email=String(values.email||'').trim();
    const phone=String(values.phone||'').trim(),locationRequired=String(values.location||'').trim();
    const digits=phone.replace(/\D/g,'');
    if(fullName.length<2||!locationRequired||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||digits.length<7||digits.length>15||!review.reportValidity()){
      feedback.hidden=false;feedback.textContent='Please check your name, email, phone, location and privacy consent before sending.';
      return;
    }
    if(values.consent!=='on'){feedback.hidden=false;feedback.textContent='Please agree to the enquiry privacy details before sending.';return;}
    // These dates may be approximate. Retain exactly what the guest entered, without inventing a date.
    const arrive=String(values.arrival||'').trim(),depart=String(values.departure||'').trim(),duration=String(values.duration||'').trim();
    const stay=[arrive?'Arrival: '+arrive:'',depart?'Departure: '+depart:'',duration?'Duration: '+duration:''].filter(Boolean).join('; ')||'Dates to be confirmed';
    const chosen=[...selectedProperties.values()];
    const brief=[
      'SOURCE: PCCO AI CHATBOT — PRIVATE TEST',
      'PURPOSE: '+String(values.purpose||'Not specified'),
      'LOCATION: '+locationRequired,
      'DATES: '+stay,
      'GUESTS: '+String(values.guests||'Not specified'),
      'BEDROOMS: '+String(values.bedrooms||'Not specified'),
      'SEPARATE BEDS: '+String(values.beds||'Not specified'),
      'PARKING: '+String(values.parking||'Not specified'),
      'BUDGET: '+String(values.budget||'To be discussed'),
      'ADDITIONAL REQUIREMENTS: '+String(values.notes||'None'),
      'SELECTED LISTINGS (AVAILABILITY NOT CONFIRMED):',
      chosen.length?chosen.map(p=>p.name+' — https://www.thepropertycareco.co.uk/properties/'+encodeURIComponent(p.slug)+'/').join('\n'):'None; please source suitable options from the wider network',
      'All availability, layouts, parking and pricing must be confirmed by PCCO.'
    ].join('\n');
    const payload={
      enquiry_type:'need_accommodation',
      source:'website_ai_preview',
      full_name:fullName,email,phone,location_required:locationRequired,
      check_in_date:/^\d{4}-\d{2}-\d{2}$/.test(arrive)?arrive:null,
      stay_length:stay.slice(0,120),guest_count:parsedCount(values.guests),
      unit_count:null,bedrooms_required:String(values.bedrooms||'').slice(0,150),
      parking_required:String(values.parking||'').slice(0,60),
      budget:String(values.budget||'').slice(0,120),
      details:brief.slice(0,3000),website:''
    };
    review.dataset.sending='true';submit.disabled=true;submit.textContent='Sending enquiry…';
    feedback.hidden=true;
    try{
      const response=await fetch(ENQUIRY_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
      const receipt=await response.json().catch(()=>({}));
      if(!response.ok||!receipt.ok)throw new Error(receipt.error||'The enquiry could not be confirmed.');
      submitted=true;
      review.hidden=true;messages.hidden=false;actions.hidden=true;chat.hidden=true;
      messages.querySelectorAll('.pcco-ai-inline-review').forEach(node=>node.remove());
      const reference=receipt.id?' Reference: '+receipt.id+'.':'';
      if(receipt.notification_sent?.owner===true){
        showStatus('Thank you, '+fullName+'. Your accommodation enquiry has been received and the email notification has been sent to PCCO Stays.'+reference+' We aim to respond within 24 hours. Availability and prices are still subject to confirmation.');
      }else{
        showStatus('Thank you, '+fullName+'. Your enquiry has been saved.'+reference+' The email notification could not be confirmed, so please contact PCCO on 07411 251361 if urgent. Do not resubmit the same request.');
      }
      selectedProperties.clear();
    }catch(err){
      feedback.hidden=false;feedback.textContent=(err instanceof Error?err.message:'Unable to send the enquiry.')+' Your details are still here; please avoid repeated submissions if you are unsure whether it arrived.';
    }finally{
      review.dataset.sending='false';
      if(!submitted){submit.disabled=false;submit.textContent='Send Enquiry';}
    }
  });
  $('.pcco-ai-existing').addEventListener('click',()=>toggle(false));
})();

'use strict';
(async()=>{const grid=document.querySelector('#property-grid');if(!grid)return;const count=document.querySelector('#results-count');
 const filters={q:document.querySelector('#filter-location'),bed:document.querySelector('#filter-bedrooms'),sleep:document.querySelector('#filter-sleeps'),parking:document.querySelector('#filter-parking')};
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const card=(p,distance)=>'<a class="property-card" href="/properties/'+encodeURIComponent(p.slug)+'/"><div class="property-card-media">'+(p.cover_photo?'<img src="'+esc('/api/property-image?property='+encodeURIComponent(p.slug)+'&size=700')+'" alt="'+esc(p.cover_photo.alt||p.name)+'" loading="lazy" width="700" height="525">':'<div class="property-card-no-photo">Photography available on request</div>')+'</div><div class="property-card-body"><div><div class="property-location">'+esc(p.postcode||'UK')+(distance!=null?' · '+esc(distance)+' miles away':'')+'</div><h3>'+esc(p.name)+'</h3></div><div class="property-facts">'+[p.bedrooms!=null?(Number(p.bedrooms)===0?'Studio':esc(p.bedrooms)+' bed'+(Number(p.bedrooms)===1?'':'s')):'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean).map(x=>'<span>'+x+'</span>').join('')+'</div><span class="property-card-cta">View property →</span></div></a>';
 const wrap=document.createElement('div');wrap.className='location-autocomplete';filters.q.parentNode.insertBefore(wrap,filters.q);wrap.appendChild(filters.q);
 const list=document.createElement('div');list.id='location-suggestions';list.className='location-suggestions';list.setAttribute('role','listbox');list.hidden=true;wrap.appendChild(list);
 const hint=document.createElement('span');hint.className='location-hint';hint.textContent='Start typing, then choose a UK place or postcode.';wrap.appendChild(hint);
 filters.q.setAttribute('autocomplete','off');filters.q.setAttribute('role','combobox');filters.q.setAttribute('aria-autocomplete','list');filters.q.setAttribute('aria-controls',list.id);filters.q.setAttribute('aria-expanded','false');
 let selected=null,suggestSeq=0,suggestTimer,active=-1;
 const closeSuggestions=()=>{list.hidden=true;list.innerHTML='';active=-1;filters.q.setAttribute('aria-expanded','false');filters.q.removeAttribute('aria-activedescendant')};
 const choose=s=>{selected=s;filters.q.value=s.label;hint.textContent='Searching within 50 miles of '+s.label;closeSuggestions();render()};
 const paintSuggestions=items=>{list.innerHTML='';active=-1;if(!items.length){list.innerHTML='<div class="location-no-result">No matching UK place found. Check the spelling and try again.</div>';list.hidden=false;filters.q.setAttribute('aria-expanded','true');return}
  items.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='location-suggestion';b.id='location-option-'+i;b.setAttribute('role','option');b.innerHTML='<strong>'+esc(s.label)+'</strong><span>'+esc(s.type||'Place')+'</span>';b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>choose(s));list.appendChild(b)});
  list.hidden=false;filters.q.setAttribute('aria-expanded','true');
 };
 const fetchSuggestions=async()=>{const q=filters.q.value.trim(),my=++suggestSeq;if(q.length<2){closeSuggestions();hint.textContent='Start typing, then choose a UK place or postcode.';return}
  hint.textContent='Finding matching UK locations…';
  try{const r=await fetch('/api/location-suggest?q='+encodeURIComponent(q),{cache:'no-store'});const d=await r.json();if(my!==suggestSeq)return;paintSuggestions(d.suggestions||[]);hint.textContent='Choose a location from the suggestions.'}
  catch{if(my!==suggestSeq)return;closeSuggestions();hint.textContent='Location suggestions are temporarily unavailable.'}
 };
 try{const r=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1',{cache:'no-store'});const all=(await r.json()).filter(p=>p.published);
 let seq=0;
 const standardFilter=(p,bed,sleep,parking)=>(!bed||Number(p.bedrooms)>=bed)&&(!sleep||Number(p.sleeps)>=sleep)&&(!parking||(parking==='yes'?p.parking_category&&p.parking_category!=='none':p.parking_category===parking));
 async function render(){const my=++seq,bed=Number(filters.bed.value||0),sleep=Number(filters.sleep.value||0),parking=filters.parking.value;
  let listData=all.filter(p=>standardFilter(p,bed,sleep,parking)),distanceMap=new Map(),radiusUsed=false;
  if(selected){
    count.textContent='Searching within 50 miles…';
    try{
      const pr=await fetch('/api/postcode-radius?lat='+encodeURIComponent(selected.lat)+'&lon='+encodeURIComponent(selected.lon)+'&label='+encodeURIComponent(selected.label)+'&radius=50',{cache:'no-store'});
      if(pr.ok){const data=await pr.json();if(my!==seq)return;distanceMap=new Map((data.matches||[]).map(x=>[x.slug,x.distance_miles]));listData=listData.filter(p=>distanceMap.has(p.slug)).sort((a,b)=>distanceMap.get(a.slug)-distanceMap.get(b.slug));radiusUsed=true;}
    }catch{}
  }else if(filters.q.value.trim()){
    count.textContent='Choose a location from the suggestions to search within 50 miles.';
  }
  if(my!==seq)return;
  if(!filters.q.value.trim()||selected)count.textContent=listData.length+' '+(listData.length===1?'property':'properties')+(radiusUsed?' within 50 miles':'')+' displayed';
  grid.innerHTML=listData.length?listData.map(p=>card(p,distanceMap.get(p.slug))).join(''):'<div class="empty-results">No displayed properties match those filters. Send us your requirements and we can source beyond the online collection.</div>';
 }
 filters.q.addEventListener('input',()=>{selected=null;clearTimeout(suggestTimer);suggestTimer=setTimeout(fetchSuggestions,220);render()});
 filters.q.addEventListener('keydown',e=>{const opts=[...list.querySelectorAll('.location-suggestion')];if(list.hidden||!opts.length)return;
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=e.key==='ArrowDown'?Math.min(active+1,opts.length-1):Math.max(active-1,0);opts.forEach((o,i)=>o.classList.toggle('is-active',i===active));filters.q.setAttribute('aria-activedescendant',opts[active].id)}
   else if(e.key==='Enter'&&active>=0){e.preventDefault();opts[active].click()}
   else if(e.key==='Escape')closeSuggestions();
 });
 filters.q.addEventListener('focus',()=>{if(filters.q.value.trim().length>=2&&!selected)fetchSuggestions()});
 filters.q.addEventListener('blur',()=>setTimeout(closeSuggestions,120));
 [filters.bed,filters.sleep,filters.parking].forEach(el=>el.addEventListener('change',render));render();
 }catch{grid.innerHTML='<div class="empty-results">The property collection could not be loaded. Please send us your requirements instead.</div>'}
})();
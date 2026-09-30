'use strict';
(async()=>{
 const grid=document.querySelector('#property-grid');if(!grid)return;
 const count=document.querySelector('#results-count');
 const mapEl=document.querySelector('#property-map');
 const listBtn=document.querySelector('#view-list');
 const mapBtn=document.querySelector('#view-map');
 const filters={q:document.querySelector('#filter-location'),bed:document.querySelector('#filter-bedrooms'),sleep:document.querySelector('#filter-sleeps'),parking:document.querySelector('#filter-parking')};
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const card=(p,distance)=>{const facts=[p.bedrooms!=null?(Number(p.bedrooms)===0?'Studio':esc(p.bedrooms)+' bed'+(Number(p.bedrooms)===1?'':'s')):'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean);const features=(Array.isArray(p.included_features)?p.included_features:[]).slice(0,3);const cover='/api/property-image?property='+encodeURIComponent(p.slug)+'&size=700'+(p.photo_version?'&v='+encodeURIComponent(p.photo_version):'');return '<a class="property-card" href="/properties/'+encodeURIComponent(p.slug)+'/"><div class="property-card-media">'+(p.cover_photo?'<img src="'+esc(cover)+'" alt="'+esc(p.cover_photo.alt||p.name)+'" loading="lazy" width="700" height="525">':'<div class="property-card-no-photo">Photography available on request</div>')+'</div><div class="property-card-body"><div><div class="property-location">'+esc(p.postcode||p.city||'Location available on request')+(distance!=null?' · '+esc(distance)+' miles away':'')+'</div><h3>'+esc(p.name)+'</h3></div><div class="property-facts">'+facts.map(x=>'<span>'+x+'</span>').join('')+'</div>'+(features.length?'<div class="property-card-features">'+features.map(x=>'<span>✓ '+esc(x)+'</span>').join('')+'</div>':'')+'<span class="property-card-cta">View property →</span></div></a>'};
 const popup=(p,distance)=>{const facts=[p.bedrooms!=null?(Number(p.bedrooms)===0?'Studio':esc(p.bedrooms)+' bed'+(Number(p.bedrooms)===1?'':'s')):'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean);const cover='/api/property-image?property='+encodeURIComponent(p.slug)+'&size=700';return '<div class="map-property-popup">'+(p.cover_photo?'<img src="'+esc(cover)+'" alt="" loading="lazy">':'')+'<div class="map-property-popup-body"><div class="property-location">'+esc(p.postcode||p.city||'UK')+(distance!=null?' · '+esc(distance)+' miles away':'')+'</div><strong>'+esc(p.name)+'</strong>'+(facts.length?'<span>'+facts.join(' · ')+'</span>':'')+'<a href="/properties/'+encodeURIComponent(p.slug)+'/">View property →</a></div></div>'};

 const wrap=document.createElement('div');wrap.className='location-autocomplete';filters.q.parentNode.insertBefore(wrap,filters.q);wrap.appendChild(filters.q);
 const suggestions=document.createElement('div');suggestions.id='location-suggestions';suggestions.className='location-suggestions';suggestions.setAttribute('role','listbox');suggestions.hidden=true;wrap.appendChild(suggestions);
 const hint=document.createElement('span');hint.className='location-hint';hint.textContent='Start typing, then choose a UK place or postcode.';wrap.appendChild(hint);
 filters.q.setAttribute('autocomplete','off');filters.q.setAttribute('role','combobox');filters.q.setAttribute('aria-autocomplete','list');filters.q.setAttribute('aria-controls',suggestions.id);filters.q.setAttribute('aria-expanded','false');

 let selected=null,suggestSeq=0,suggestTimer,active=-1,renderSeq=0,activeView='list';
 let map=null,propertyLayer=null,searchLayer=null,allCoordinates=null,allCoordinatesPromise=null,lastListData=[],lastDistanceMap=new Map(),lastCoordMap=new Map();
 let render=async()=>{};

 const closeSuggestions=()=>{suggestions.hidden=true;suggestions.innerHTML='';active=-1;filters.q.setAttribute('aria-expanded','false');filters.q.removeAttribute('aria-activedescendant')};
 const choose=s=>{selected=s;filters.q.value=s.label;hint.textContent='Searching within 15 miles of '+s.label;closeSuggestions();render()};
 const paintSuggestions=items=>{suggestions.innerHTML='';active=-1;if(!items.length){suggestions.innerHTML='<div class="location-no-result">No matching UK place found. Check the spelling and try again.</div>';suggestions.hidden=false;filters.q.setAttribute('aria-expanded','true');return}
  items.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='location-suggestion';b.id='location-option-'+i;b.setAttribute('role','option');b.innerHTML='<strong>'+esc(s.label)+'</strong><span>'+esc(s.type||'Place')+'</span>';b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>choose(s));suggestions.appendChild(b)});
  suggestions.hidden=false;filters.q.setAttribute('aria-expanded','true');
 };
 const fetchSuggestions=async()=>{const q=filters.q.value.trim(),my=++suggestSeq;if(q.length<2){closeSuggestions();hint.textContent='Start typing, then choose a UK place or postcode.';return}
  hint.textContent='Finding matching UK locations…';
  try{const r=await fetch('/api/location-suggest?q='+encodeURIComponent(q),{cache:'no-store'});const d=await r.json();if(my!==suggestSeq)return;paintSuggestions(d.suggestions||[]);hint.textContent='Choose a location from the suggestions.'}
  catch{if(my!==suggestSeq)return;closeSuggestions();hint.textContent='Location suggestions are temporarily unavailable.'}
 };

 const ensureMap=()=>{
  if(map)return map;
  if(!mapEl||!window.L)return null;
  map=L.map(mapEl,{zoomControl:true,scrollWheelZoom:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  propertyLayer=L.layerGroup().addTo(map);
  searchLayer=L.layerGroup().addTo(map);
  map.setView([54.5,-3.2],5);
  return map;
 };
 const pinIcon=()=>L.divIcon({className:'pcco-map-marker',html:'<span aria-hidden="true"></span>',iconSize:[30,38],iconAnchor:[15,38],popupAnchor:[0,-34]});
 const fetchAllCoordinates=async()=>{
  if(allCoordinates)return allCoordinates;
  if(allCoordinatesPromise)return allCoordinatesPromise;
  allCoordinatesPromise=(async()=>{
   const r=await fetch('/api/postcode-radius?all=1',{cache:'no-store'});
   if(!r.ok)throw new Error('Map locations unavailable');
   const data=await r.json();
   allCoordinates=new Map((data.matches||[]).map(x=>[x.slug,{lat:Number(x.lat),lon:Number(x.lon)}]).filter(x=>Number.isFinite(x[1].lat)&&Number.isFinite(x[1].lon)));
   return allCoordinates;
  })();
  try{return await allCoordinatesPromise}finally{allCoordinatesPromise=null}
 };
 const paintMap=(listData,coordMap,distanceMap)=>{
  const instance=ensureMap();if(!instance)return;
  propertyLayer.clearLayers();searchLayer.clearLayers();
  const points=[];
  listData.forEach(p=>{const c=coordMap.get(p.slug);if(!c||!Number.isFinite(c.lat)||!Number.isFinite(c.lon))return;points.push([c.lat,c.lon]);L.marker([c.lat,c.lon],{icon:pinIcon(),title:p.name}).bindPopup(popup(p,distanceMap.get(p.slug)),{maxWidth:260,minWidth:220}).addTo(propertyLayer)});
  if(selected){
   const style=getComputedStyle(document.documentElement),navy=style.getPropertyValue('--navy').trim()||'#021B3C',gold=style.getPropertyValue('--gold').trim()||'#c6a15b';
   L.circle([selected.lat,selected.lon],{radius:24140,color:navy,weight:1,opacity:.45,fillColor:navy,fillOpacity:.035,interactive:false}).addTo(searchLayer);
   L.circleMarker([selected.lat,selected.lon],{radius:7,color:navy,weight:3,fillColor:gold,fillOpacity:1}).bindTooltip('Searched location',{direction:'top'}).addTo(searchLayer);
   points.push([selected.lat,selected.lon]);
  }
  if(points.length===1)instance.setView(points[0],selected?10:9);
  else if(points.length>1)instance.fitBounds(points,{padding:[32,32],maxZoom:selected?11:10});
  else instance.setView([54.5,-3.2],5);
  requestAnimationFrame(()=>instance.invalidateSize());
 };

 const setView=async view=>{
  if(view==='map'&&!window.L){
   activeView='list';grid.hidden=false;if(mapEl)mapEl.hidden=true;
   listBtn?.setAttribute('aria-pressed','true');mapBtn?.setAttribute('aria-pressed','false');
   count.textContent='Map view is temporarily unavailable. Showing the property list.';
   return;
  }
  activeView=view;
  if(listBtn)listBtn.setAttribute('aria-pressed',String(view==='list'));
  if(mapBtn)mapBtn.setAttribute('aria-pressed',String(view==='map'));
  grid.hidden=view==='map';
  if(mapEl)mapEl.hidden=view!=='map';
  await render();
 };

 try{
 const r=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1',{cache:'no-store'});const all=(await r.json()).filter(p=>p.published);
 const standardFilter=(p,bed,sleep,parking)=>(!bed||Number(p.bedrooms)>=bed)&&(!sleep||Number(p.sleeps)>=sleep)&&(!parking||(parking==='yes'?['free','paid','parking'].includes(p.parking_category):p.parking_category===parking));

 render=async function(){const my=++renderSeq,bed=Number(filters.bed.value||0),sleep=Number(filters.sleep.value||0),parking=filters.parking.value;
  let listData=all.filter(p=>standardFilter(p,bed,sleep,parking)),distanceMap=new Map(),coordMap=new Map(),radiusUsed=false;
  if(selected){
    count.textContent='Searching within 15 miles…';
    try{
      const pr=await fetch('/api/postcode-radius?lat='+encodeURIComponent(selected.lat)+'&lon='+encodeURIComponent(selected.lon)+'&label='+encodeURIComponent(selected.label)+'&radius=15',{cache:'no-store'});
      if(pr.ok){const data=await pr.json();if(my!==renderSeq)return;distanceMap=new Map((data.matches||[]).map(x=>[x.slug,x.distance_miles]));coordMap=new Map((data.matches||[]).map(x=>[x.slug,{lat:Number(x.lat),lon:Number(x.lon)}]));listData=listData.filter(p=>distanceMap.has(p.slug)).sort((a,b)=>distanceMap.get(a.slug)-distanceMap.get(b.slug));radiusUsed=true;}
    }catch{}
  }else if(activeView==='map'){
    try{coordMap=await fetchAllCoordinates();if(my!==renderSeq)return}catch{}
  }

  if(my!==renderSeq)return;
  const q=filters.q.value.trim();
  if(q&&!selected)count.textContent='Choose a location from the suggestions to search within 15 miles. Showing the UK-wide collection for now.';
  else{
    const mapped=activeView==='map'?listData.filter(p=>coordMap.has(p.slug)).length:null;
    count.textContent=listData.length+' '+(listData.length===1?'property':'properties')+(radiusUsed?' within 15 miles':'')+' displayed'+(mapped!=null&&mapped<listData.length?' · '+mapped+' mapped':'');
  }
  grid.innerHTML=listData.length?listData.map(p=>card(p,distanceMap.get(p.slug))).join(''):'<div class="empty-results">No displayed properties match those filters. Send us your requirements and we can source beyond the online collection.</div>';
  lastListData=listData;lastDistanceMap=distanceMap;lastCoordMap=coordMap;
  if(activeView==='map'){
   paintMap(listData,coordMap,distanceMap);
   if(mapEl&&!listData.some(p=>coordMap.has(p.slug)))mapEl.setAttribute('data-empty','true');else mapEl?.removeAttribute('data-empty');
  }
 };

 filters.q.addEventListener('input',()=>{selected=null;clearTimeout(suggestTimer);suggestTimer=setTimeout(fetchSuggestions,220);if(!filters.q.value.trim())hint.textContent='All UK properties are shown when no location is selected.';render()});
 filters.q.addEventListener('keydown',e=>{const opts=[...suggestions.querySelectorAll('.location-suggestion')];if(suggestions.hidden||!opts.length)return;
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=e.key==='ArrowDown'?Math.min(active+1,opts.length-1):Math.max(active-1,0);opts.forEach((o,i)=>o.classList.toggle('is-active',i===active));filters.q.setAttribute('aria-activedescendant',opts[active].id)}
   else if(e.key==='Enter'&&active>=0){e.preventDefault();opts[active].click()}
   else if(e.key==='Escape')closeSuggestions();
 });
 filters.q.addEventListener('focus',()=>{if(filters.q.value.trim().length>=2&&!selected)fetchSuggestions()});
 filters.q.addEventListener('blur',()=>setTimeout(closeSuggestions,120));
 [filters.bed,filters.sleep,filters.parking].forEach(el=>el.addEventListener('change',render));
 listBtn?.addEventListener('click',()=>setView('list'));
 mapBtn?.addEventListener('click',()=>setView('map'));
 await render();
 }catch{grid.innerHTML='<div class="empty-results">The property collection could not be loaded. Please send us your requirements instead.</div>';if(mapBtn)mapBtn.disabled=true}
})();
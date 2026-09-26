'use strict';
(async()=>{const grid=document.querySelector('#property-grid');if(!grid)return;const count=document.querySelector('#results-count');
 const filters={q:document.querySelector('#filter-location'),bed:document.querySelector('#filter-bedrooms'),sleep:document.querySelector('#filter-sleeps'),parking:document.querySelector('#filter-parking')};
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const card=(p,distance)=>'<a class="property-card" href="/properties/'+encodeURIComponent(p.slug)+'/"><div class="property-card-media">'+(p.cover_photo?'<img src="'+esc('/api/property-image?property='+encodeURIComponent(p.slug)+'&size=700')+'" alt="'+esc(p.cover_photo.alt||p.name)+'" loading="lazy" width="700" height="525">':'<div class="property-card-no-photo">Photography available on request</div>')+'</div><div class="property-card-body"><div><div class="property-location">'+esc(p.postcode||'UK')+(distance!=null?' · '+esc(distance)+' miles away':'')+'</div><h3>'+esc(p.name)+'</h3></div><div class="property-facts">'+[p.bedrooms?esc(p.bedrooms)+' bed'+(p.bedrooms===1?'':'s'):'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean).map(x=>'<span>'+x+'</span>').join('')+'</div><span class="property-card-cta">View property →</span></div></a>';
 try{const r=await fetch('https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1',{cache:'no-store'});const all=(await r.json()).filter(p=>p.published);
 let seq=0,timer;
 const standardFilter=(p,bed,sleep,parking)=>(!bed||Number(p.bedrooms)>=bed)&&(!sleep||Number(p.sleeps)>=sleep)&&(!parking||(parking==='yes'?p.parking_category&&p.parking_category!=='none':p.parking_category===parking));
 const render=async()=>{const my=++seq,q=filters.q.value.trim(),low=q.toLowerCase(),bed=Number(filters.bed.value||0),sleep=Number(filters.sleep.value||0),parking=filters.parking.value;
  let list=[],distanceMap=new Map(),radiusUsed=false;
  const postcodeLike=/^[A-Za-z]{1,2}\d[A-Za-z\d]?(?:\s?\d[A-Za-z]{2})?$/.test(q);
  if(q&&postcodeLike&&q.replace(/\s+/g,'').length>=2){
    count.textContent='Searching within 50 miles…';
    try{
      const pr=await fetch('/api/postcode-radius?postcode='+encodeURIComponent(q)+'&radius=50',{cache:'no-store'});
      if(pr.ok){const data=await pr.json();if(my!==seq)return;distanceMap=new Map((data.matches||[]).map(x=>[x.slug,x.distance_miles]));list=all.filter(p=>distanceMap.has(p.slug)&&standardFilter(p,bed,sleep,parking)).sort((a,b)=>distanceMap.get(a.slug)-distanceMap.get(b.slug));radiusUsed=true;}
    }catch{}
  }
  if(!radiusUsed){list=all.filter(p=>(!low||[p.name,p.postcode,p.city].some(v=>String(v||'').toLowerCase().includes(low)))&&standardFilter(p,bed,sleep,parking));}
  if(my!==seq)return;
  count.textContent=list.length+' '+(list.length===1?'property':'properties')+(radiusUsed?' within 50 miles':'')+' displayed';
  grid.innerHTML=list.length?list.map(p=>card(p,distanceMap.get(p.slug))).join(''):'<div class="empty-results">No displayed properties match those filters. Send us your requirements and we can source beyond the online collection.</div>';
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,filters.q===document.activeElement?350:0)};
 filters.q.addEventListener('input',schedule);[filters.bed,filters.sleep,filters.parking].forEach(el=>el.addEventListener('change',render));render();
 }catch{grid.innerHTML='<div class="empty-results">The property collection could not be loaded. Please send us your requirements instead.</div>'}
})();
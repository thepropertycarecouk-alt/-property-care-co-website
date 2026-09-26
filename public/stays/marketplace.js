'use strict';
(async()=>{const root=document.querySelector('#featured-property-track');if(!root)return;
 const carousel=document.querySelector('#featured-property-carousel'),prev=document.querySelector('#featured-prev'),next=document.querySelector('#featured-next');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let paused=false,raf=0,last=0,baseWidth=0;
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const fact=p=>[p.bedrooms?esc(p.bedrooms)+' bed'+(p.bedrooms===1?'':'s'):'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean).map(x=>'<span>'+x+'</span>').join('');
 const card=p=>'<a class="property-card" href="/properties/'+encodeURIComponent(p.slug)+'/">'+
   '<div class="property-card-media">'+(p.cover_photo?'<img src="'+esc(p.cover_photo.thumb||p.cover_photo.src)+'" alt="'+esc(p.cover_photo.alt||p.name)+'" loading="lazy" width="700" height="525">':'<div class="property-card-no-photo">Photography available on request</div>')+'</div>'+
   '<div class="property-card-body"><div><div class="property-location">'+esc(p.postcode||'UK')+'</div><h3>'+esc(p.name)+'</h3></div><div class="property-facts">'+fact(p)+'</div><span class="property-card-cta">View property →</span></div></a>';
 try{const r=await fetch('/stays/properties.json',{cache:'no-store'});const all=await r.json();const items=all.filter(p=>p.published&&p.featured&&p.cover_photo);if(!items.length){root.closest('.property-carousel-shell').hidden=true;return}
   const markup=items.map(card).join('');root.innerHTML=markup+markup;requestAnimationFrame(()=>{baseWidth=root.scrollWidth/2});
   const move=dir=>carousel.scrollBy({left:dir*Math.min(360,carousel.clientWidth*.85),behavior:reduce?'auto':'smooth'});prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
   const stop=()=>paused=true,start=()=>paused=false;carousel.addEventListener('pointerdown',stop);carousel.addEventListener('pointerup',()=>setTimeout(start,1200));carousel.addEventListener('mouseenter',stop);carousel.addEventListener('mouseleave',start);carousel.addEventListener('focusin',stop);carousel.addEventListener('focusout',start);
   if(!reduce){const tick=t=>{if(!paused&&t-last>20&&baseWidth){carousel.scrollLeft+=.35;if(carousel.scrollLeft>=baseWidth)carousel.scrollLeft-=baseWidth;last=t}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
 }catch{root.closest('.property-carousel-shell').hidden=true}
 window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
})();
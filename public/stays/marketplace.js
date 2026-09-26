'use strict';
(async () => {
  const root = document.querySelector('#hero-property-visual');
  if (!root) return;
  const endpoint = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fallback = root.innerHTML;
  let timer, index = 0, hover = false, focus = false, interacting = false, manualPause = false, pointer, swiped = false, stopped = false;
  try {
    const response = await fetch(endpoint, {cache:'no-store', signal:AbortSignal.timeout(10000)});
    if (!response.ok) return;
    const items = (await response.json()).filter(p => p.published && p.featured && p.cover_photo).slice(0,8);
    if (!items.length) return;
    const source = p => '/api/property-image?property='+encodeURIComponent(p.slug)+'&size=1600';
    await new Promise((resolve, reject) => {const image = new Image(); const timeout=setTimeout(reject,20000); image.onload = ()=>{clearTimeout(timeout);resolve();}; image.onerror = ()=>{clearTimeout(timeout);reject();}; image.src = source(items[0]);});
    root.classList.add('hero-has-properties');
    root.setAttribute('role','region'); root.setAttribute('aria-label','Featured accommodation');
    root.setAttribute('aria-roledescription','carousel');
    root.innerHTML = '<div class="hero-property-slides">' + items.map((p,i) =>
      '<a class="hero-property-slide'+(i===0?' is-active':'')+'" href="/properties/'+encodeURIComponent(p.slug)+'/" aria-hidden="'+(i!==0)+'" tabindex="'+(i===0?'0':'-1')+'">'+
      '<img src="'+esc(source(p))+'" alt="'+esc(p.cover_photo.alt || p.name)+'" width="1600" height="1000" '+(i?'loading="lazy"':'fetchpriority="high"')+'>'+
      '<div class="hero-property-caption"><span class="small-label">'+esc(p.postcode || p.city || '')+'</span><h2>'+esc(p.name)+'</h2><p>'+[p.bedrooms?esc(p.bedrooms)+' bedrooms':'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean).join(' · ')+'</p><span class="hero-property-link">View property ↗</span></div></a>'
    ).join('')+'</div><div class="hero-carousel-bar"><span class="small-label">FEATURED ACCOMMODATION</span><div class="hero-carousel-controls"><button type="button" id="featured-prev" aria-label="Previous property">←</button><button type="button" id="featured-pause" aria-label="Pause slideshow">Ⅱ</button><button type="button" id="featured-next" aria-label="Next property">→</button></div></div><span class="sr-only" id="featured-status" aria-live="polite"></span>';
    const slides = [...root.querySelectorAll('.hero-property-slide')], pause = root.querySelector('#featured-pause');
    const syncPause = () => {pause.textContent = manualPause ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label',manualPause ? 'Play slideshow' : 'Pause slideshow');pause.hidden=reduced.matches;};
    const schedule = () => {clearTimeout(timer); if(!stopped && items.length>1 && !reduced.matches && !manualPause && !hover && !focus && !interacting && !document.hidden) timer=setTimeout(()=>show(index+1),6500);};
    const show = (next, announce=false) => {
      if(stopped)return;
      index=(next+items.length)%items.length;
      slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));slide.tabIndex=i===index?0:-1;});
      if(announce)root.querySelector('#featured-status').textContent=items[index].name+', '+(index+1)+' of '+items.length;
      schedule();
    };
    root.querySelector('#featured-prev').addEventListener('click',()=>show(index-1,true));
    root.querySelector('#featured-next').addEventListener('click',()=>show(index+1,true));
    pause.addEventListener('click',()=>{manualPause=!manualPause;syncPause();schedule();});
    root.addEventListener('mouseenter',()=>{hover=true;schedule();});root.addEventListener('mouseleave',()=>{hover=false;schedule();});
    root.addEventListener('focusin',()=>{focus=true;schedule();});root.addEventListener('focusout',event=>{focus=root.contains(event.relatedTarget);schedule();});
    root.addEventListener('pointerdown',event=>{pointer={x:event.clientX,y:event.clientY};swiped=false;interacting=true;schedule();});
    window.addEventListener('pointerup',event=>{if(!pointer)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;interacting=false;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swiped=true;show(index+(dx<0?1:-1),true);}schedule();});
    window.addEventListener('pointercancel',()=>{pointer=null;interacting=false;schedule();});
    root.addEventListener('click',event=>{if(swiped&&event.target.closest('a')){event.preventDefault();swiped=false;}},true);
    root.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1),true);}});
    document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',()=>{syncPause();schedule();});
    root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{stopped=true;clearTimeout(timer);root.classList.remove('hero-has-properties');root.removeAttribute('aria-roledescription');root.setAttribute('aria-label','UK-wide accommodation');root.innerHTML=fallback;},{once:true}));
    window.addEventListener('pagehide',()=>clearTimeout(timer));
    if(items.length===1)root.querySelector('.hero-carousel-controls').hidden=true;
    syncPause();schedule();
  } catch { /* Retain the approved fallback when the feed or supplied image is unavailable. */ }
})();

'use strict';
(async () => {
  const root = document.querySelector('#hero-property-visual');
  if (!root) return;

  const endpoint = 'https://pgbwbklqvyyzipbxcdvx.supabase.co/functions/v1/pcc-property-feed?summary=1';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const reduced = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false,addEventListener(){}};
  const source = p => '/api/property-image?property='+encodeURIComponent(p.slug)+'&size=1600'+(p.photo_version?'&v='+encodeURIComponent(p.photo_version):'');
  const outward = v => { const s=String(v||'').trim().toUpperCase().replace(/\s+/g,' '); return s?s.split(' ')[0]:''; };

  const fallbackItems = [
    {slug:'stay-stz-004',name:'5-bedroom Cottage · Jacobs Well',bedrooms:5,sleeps:12,postcode:'GU4',city:'Jacobs Well',cover_photo:{alt:'5-bedroom cottage in Jacobs Well'}},
    {slug:'stay-d3-003',name:'3-bedroom Property',bedrooms:3,sleeps:11,cover_photo:{alt:'3-bedroom property'}},
    {slug:'stay-rth-022',name:'6-bedroom Property · Oxfordshire',bedrooms:6,sleeps:11,postcode:'OX1',city:'Oxfordshire',cover_photo:{alt:'6-bedroom property in Oxfordshire'}},
    {slug:'stay-fab-045',name:'5-bedroom House',bedrooms:5,sleeps:10,cover_photo:{alt:'5-bedroom house'}},
    {slug:'stay-vel-003',name:'4-bedroom Property · Coventry',bedrooms:4,sleeps:10,postcode:'CV5',city:'Coventry',cover_photo:{alt:'4-bedroom Coventry property'}},
    {slug:'stay-bro-007',name:'4-bedroom House · Wickham Bishops',bedrooms:4,sleeps:9,postcode:'CM8',city:'Wickham Bishops',cover_photo:{alt:'4-bedroom house in Wickham Bishops'}},
    {slug:'stay-jgs-004',name:'4-bedroom Apartment · Belvedere',bedrooms:4,sleeps:9,cover_photo:{alt:'4-bedroom apartment in Belvedere'}},
    {slug:'stay-stk-009',name:'4-bedroom House · Langley',bedrooms:4,postcode:'SL3',city:'Langley',cover_photo:{alt:'4-bedroom house in Langley'}},
    {slug:'stay-lex-007',name:'3-bedroom Apartment · Watford',bedrooms:3,postcode:'WD17',city:'Watford',cover_photo:{alt:'3-bedroom apartment in Watford'}},
    {slug:'stay-nst-001',name:'2-bedroom Home · Wixams',bedrooms:2,sleeps:4,postcode:'MK42',city:'Wixams, Bedford',cover_photo:{alt:'2-bedroom home in Wixams'}}
  ].map(p => Object.assign({published:true,featured:true},p));

  const sortItems = items => items
    .filter(p => p && p.published !== false && p.featured !== false && p.cover_photo && p.slug)
    .sort((a,b) => {
      const aBedrooms=Number(a.bedrooms)||0, bBedrooms=Number(b.bedrooms)||0;
      const aSleeps=Number(a.sleeps)||0, bSleeps=Number(b.sleeps)||0;
      const aLarge=(aBedrooms>=6||aSleeps>=6)?1:0, bLarge=(bBedrooms>=6||bSleeps>=6)?1:0;
      return (bLarge-aLarge) || (bSleeps-aSleeps) || (bBedrooms-aBedrooms) || String(a.name||'').localeCompare(String(b.name||''));
    })
    .slice(0,12);

  const loadItems = async () => {
    try {
      const timeout = new Promise((_,reject)=>setTimeout(()=>reject(new Error('feed timeout')),8000));
      const response = await Promise.race([fetch(endpoint,{cache:'no-store'}),timeout]);
      if (!response || !response.ok) throw new Error('feed unavailable');
      const live = sortItems(await response.json());
      return live.length ? live : fallbackItems;
    } catch {
      return fallbackItems;
    }
  };

  let timer, index = 0, hover = false, focus = false, interacting = false, manualPause = false, pointer, swiped = false;
  const items = await loadItems();
  if (!items.length) return;

  root.classList.add('hero-has-properties');
  root.setAttribute('role','region');
  root.setAttribute('aria-label','Featured accommodation');
  root.setAttribute('aria-roledescription','carousel');

  root.innerHTML =
    '<div class="hero-property-slides">' +
      items.map((p,i) =>
        '<a class="hero-property-slide'+(i===0?' is-active':'')+'" href="/properties/'+encodeURIComponent(p.slug)+'/" aria-hidden="'+(i!==0)+'" tabindex="'+(i===0?'0':'-1')+'">'+
          '<img src="'+esc(source(p))+'" alt="'+esc((p.cover_photo&&p.cover_photo.alt)||p.name)+'" width="1600" height="1000" '+(i?'loading="lazy"':'fetchpriority="high"')+'>'+
          '<div class="hero-property-caption"><span class="small-label">'+esc(outward(p.postcode) || p.city || '')+'</span><h2>'+esc(p.name)+'</h2><p>'+
            [p.bedrooms!=null?(Number(p.bedrooms)===0?'Studio':esc(p.bedrooms)+' bedrooms'):'',p.sleeps?'Sleeps '+esc(p.sleeps):'',p.parking?esc(p.parking):''].filter(Boolean).join(' · ')+
          '</p><span class="hero-property-link">View property ↗</span></div>'+
        '</a>'
      ).join('')+
    '</div>'+
    '<div class="hero-carousel-bar"><span class="small-label">FEATURED ACCOMMODATION</span><div class="hero-carousel-controls">'+
      '<button type="button" id="featured-prev" aria-label="Previous property">←</button>'+
      '<button type="button" id="featured-pause" aria-label="Pause slideshow">Ⅱ</button>'+
      '<button type="button" id="featured-next" aria-label="Next property">→</button>'+
    '</div></div>'+
    '<span class="sr-only" id="featured-status" aria-live="polite"></span>';

  const slides = [...root.querySelectorAll('.hero-property-slide')];
  const pause = root.querySelector('#featured-pause');
  const status = root.querySelector('#featured-status');

  const syncPause = () => {
    if (!pause) return;
    pause.textContent = manualPause ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label',manualPause ? 'Play slideshow' : 'Pause slideshow');
    pause.hidden = !!reduced.matches;
  };

  const schedule = () => {
    clearTimeout(timer);
    if(items.length>1 && !reduced.matches && !manualPause && !hover && !focus && !interacting && !document.hidden) {
      timer=setTimeout(()=>show(index+1),6500);
    }
  };

  const show = (next, announce=false) => {
    index=(next+items.length)%items.length;
    slides.forEach((slide,i)=>{
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',String(i!==index));
      slide.tabIndex=i===index?0:-1;
    });
    if(announce && status) status.textContent=items[index].name+', '+(index+1)+' of '+items.length;
    schedule();
  };

  root.querySelector('#featured-prev')?.addEventListener('click',()=>show(index-1,true));
  root.querySelector('#featured-next')?.addEventListener('click',()=>show(index+1,true));
  pause?.addEventListener('click',()=>{manualPause=!manualPause;syncPause();schedule();});

  root.addEventListener('mouseenter',()=>{hover=true;schedule();});
  root.addEventListener('mouseleave',()=>{hover=false;schedule();});
  root.addEventListener('focusin',()=>{focus=true;schedule();});
  root.addEventListener('focusout',event=>{focus=root.contains(event.relatedTarget);schedule();});
  root.addEventListener('pointerdown',event=>{pointer={x:event.clientX,y:event.clientY};swiped=false;interacting=true;schedule();});
  window.addEventListener('pointerup',event=>{
    if(!pointer)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    pointer=null;interacting=false;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){swiped=true;show(index+(dx<0?1:-1),true);}
    schedule();
  });
  window.addEventListener('pointercancel',()=>{pointer=null;interacting=false;schedule();});
  root.addEventListener('click',event=>{if(swiped&&event.target.closest('a')){event.preventDefault();swiped=false;}},true);
  root.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1),true);}});

  root.querySelectorAll('img').forEach((img,i)=>{
    img.addEventListener('error',()=>{
      img.style.display='none';
      slides[i]?.classList.add('hero-property-image-missing');
      if(i===index && items.length>1) show(index+1);
    },{once:true});
  });

  document.addEventListener('visibilitychange',schedule);
  if(reduced.addEventListener) reduced.addEventListener('change',()=>{syncPause();schedule();});
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  if(items.length===1) root.querySelector('.hero-carousel-controls').hidden=true;

  syncPause();
  schedule();
})();

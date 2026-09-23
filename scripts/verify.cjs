const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {default:server}=await import('./dev.mjs');
 const browser=await chromium.launch({executablePath:'/tmp/pcco-browser/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});const results=[];
 for(const viewport of [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,acceptDownloads:true});const page=await context.newPage();const errors=[];let submitted;await page.route('**/functions/v1/pcc-accommodation',async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,id:'qa-mocked-success'})});});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/stays/',{waitUntil:'networkidle'});
  await page.screenshot({path:`test-results/${viewport.width}-home.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');
  assert.equal(await page.locator('.hero-photo').evaluate(el=>el.complete&&el.naturalWidth>0),true,'Hero loaded');
  if(viewport.width<640){await page.getByRole('button',{name:'Open menu',exact:true}).click();assert.equal(await page.getByRole('navigation').getByRole('link',{name:/Cleaning/}).getAttribute('href'),'/cleans');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'),'false');}
  await page.locator('#quick-location').fill('Cardiff CF10');await page.locator('#quick-guests').fill('15');await page.getByRole('button',{name:'Build my enquiry'}).click();
  assert.equal(await page.locator('#location').inputValue(),'Cardiff CF10');assert.equal(await page.locator('#guests').inputValue(),'15');
  await page.locator('[data-step="1"] .next-step').click();assert.equal(await page.locator('#form-error').isVisible(),true,'Missing dates blocked');
  const base=await page.locator('#arrival').getAttribute('min');let a=new Date(base+'T12:00:00Z');a.setUTCDate(a.getUTCDate()+7);const arrival=a.toISOString().slice(0,10);a.setUTCDate(a.getUTCDate()+28);const departure=a.toISOString().slice(0,10);
  await page.locator('#arrival').fill(arrival);await page.locator('#departure').fill(arrival);await page.locator('[data-step="1"] .next-step').click();assert.equal(await page.locator('[data-step="1"]').isVisible(),true,'Invalid date order blocked');
  await page.locator('#departure').fill(departure);await page.locator('[data-step="1"] .next-step').click();
  await page.locator('#budget').fill('150');await page.locator('[name="beds"]').selectOption('Separate single beds');await page.getByLabel('Van parking',{exact:true}).check();await page.locator('[name="cleaning"]').selectOption('Fortnightly cleaning');await page.locator('[name="split"]').selectOption('Yes, nearby properties');
  await page.locator('[data-step="2"] .next-step').click();await page.locator('#contact-name').fill('Preview Test');await page.locator('#email').fill('invalid');await page.getByRole('button',{name:'Send enquiry'}).click();assert.equal(await page.locator('#form-error').isVisible(),true,'Invalid email blocked');
  await page.locator('#email').fill('preview@example.com');await page.locator('[name=phone]').fill('+44 7411 251361');await page.locator('#consent').check();await page.getByRole('button',{name:'Send enquiry'}).click();await page.locator('#send-panel').waitFor({state:'visible'});
  const whatsapp=await page.locator('#send-whatsapp').getAttribute('href');const email=await page.locator('#send-email').getAttribute('href');assert(whatsapp.startsWith('https://wa.me/447411251361?text='));assert(email.startsWith('mailto:thepropertycarecouk@gmail.com?'));
  for(const item of ['Cardiff CF10','Guests: 15','Separate single beds','Fortnightly cleaning','Van parking','150','preview@example.com'])assert(decodeURIComponent(whatsapp).includes(item));
  assert(decodeURIComponent(whatsapp).includes('28 nights'));assert.equal(submitted.enquiry_type,'need_accommodation');assert.equal(submitted.phone,'+44 7411 251361');assert.equal(submitted.guest_count,15);assert(submitted.details.includes('Fortnightly cleaning'));assert((await page.locator('#send-panel').innerText()).includes('Your enquiry has been submitted'));
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download brief'}).click();const dl=await downloadPromise;const path=await dl.path();assert(fs.readFileSync(path,'utf8').includes('Guests: 15'));
  await page.screenshot({path:`test-results/${viewport.width}-ready.png`,fullPage:true});
  await page.locator('[data-service=Relocation]').click();
  await page.locator('#flexible').check();await page.locator('#duration').fill('32 weeks, January start');await page.locator('[data-step="1"] .next-step').click();await page.locator('[data-step="2"] .next-step').click();assert((await page.locator('#review-summary').innerText()).includes('Dates to be confirmed — 32 weeks, January start'));
  await page.locator('.consent .privacy-open').click();assert.equal(await page.locator('#privacy-dialog').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#privacy-dialog').isVisible(),false);
  await page.locator('#whatsapp-toggle').click();assert.equal(await page.locator('#whatsapp-panel').isVisible(),true);assert((await page.locator('#whatsapp-panel a').getAttribute('href')).includes('447411251361'));await page.locator('#whatsapp-close').click();
  await page.locator('[data-service="Relocation"]').click();assert.equal(await page.locator('#service').inputValue(),'Relocation');assert.equal(await page.locator('[data-step="1"]').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No overflow after interactions');assert.deepEqual(errors,[]);
  results.push({viewport,checks:'PASS: navigation, service paths, quick enquiry, required fields, dates, summary, mocked submission payload, email/WhatsApp follow-up, download, edits, flexible dates, privacy, contact, overflow, JS errors'});await context.close();
 }
 // Additional narrow screen sanity check.
 const page=await browser.newPage({viewport:{width:320,height:740}});await page.goto('http://127.0.0.1:4173/stays/');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'320px overflow');
 fs.writeFileSync('test-results/verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});

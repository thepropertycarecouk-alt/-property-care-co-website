const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const {default:server}=await import('./dev.mjs');const browser=await chromium.launch({executablePath:'/tmp/pcco-browser/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
for(const width of [1440,768,390]){const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];const actions=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/functions/v1/pcc-public',async route=>{const d=route.request().postDataJSON();actions.push(d);let out={ok:true};
if(d.action==='create_estimate')out={ok:true,token:'qa-test',service_name:'Deep cleaning',estimate:{display:'£110–£200'},breakdown:[]};
if(d.action==='availability')out={ok:true,dates:[{date:'2026-10-10',slots:[{time:'09:00',status:'available'}]}]};
if(d.action==='create_monthly_checkout')out={ok:true,url:'http://127.0.0.1:4173/cleans?monthly=cancelled#estimate'};
await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});});
await page.goto('http://127.0.0.1:4173/cleans');assert((await page.title()).includes('Property Care'));
for(const service of ['deep','regular','carpet','airbnb','monthly']){await page.locator(`.service[data-service="${service}"]`).click();assert(await page.locator('#'+service+'Fields').isVisible());}
assert((await page.locator('#monthlyComparison').innerText()).includes('£139'));
await page.locator('#monthlyConfig').selectOption('three');assert((await page.locator('#monthlyComparison').innerText()).includes('£449'));
await page.locator('#monthlyConfig').selectOption('four');assert((await page.locator('#monthlyComparison').innerText()).includes('£569'));
await page.locator('.monthlyCheckoutBtn[data-plan=essential]').click();await page.waitForURL('**/cleans?monthly=cancelled#estimate');assert(actions.some(a=>a.action==='create_monthly_checkout'&&a.plan==='essential'&&a.property_band==='four'));
await page.locator('.service[data-service=deep]').click();await page.locator('#name').fill('QA Test');await page.locator('#email').fill('qa@example.com');await page.locator('#phone').fill('+447411251361');await page.locator('#postcode').fill('CF10 1AA');await page.locator('#estimateBtn').click();await page.locator('#dates .date').waitFor();await page.locator('#dates .date').click();await page.locator('#slots .slot').click();await page.locator('#requestBtn').click();await page.waitForFunction(()=>document.querySelector('#requestBtn').disabled);assert(actions.some(a=>a.action==='request_booking'&&a.token==='qa-test'));
await page.screenshot({path:`test-results/${width}-cleans.png`,fullPage:true});assert.deepEqual(errors,[]);console.log(width,'cleaning PASS: services, unchanged monthly prices, mocked estimate / booking / checkout payloads; no actual charge');
await page.goto('http://127.0.0.1:4173/?monthly=cancelled#estimate');await page.waitForURL('**/cleans?monthly=cancelled#estimate');await page.close();}
await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1)});

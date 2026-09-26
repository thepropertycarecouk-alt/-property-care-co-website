import {copyFile, access, cp, mkdir, readFile, writeFile} from 'node:fs/promises';
for (const file of [
  'public/stays/index.html','public/stays/app.js','public/stays/styles.css',
  'public/stays/marketplace.css','public/stays/marketplace.js','public/stays/property-browser.js',
  'public/stays/property-page.js','public/stays/property-template.html','public/stays/properties.json',
  'public/properties/index.html','public/partners/terms/index.html','public/partners/onboarding/index.html',
  'public/stays/assets/02_Transparent_Landscape_Logo.png','public/stays/assets/living-room.jpg'
]) await access(file);
await copyFile('public/stays/index.html', 'public/index.html');
await mkdir('dist', {recursive: true});
await cp('public', 'dist', {recursive: true});

const properties=JSON.parse(await readFile('public/stays/properties.json','utf8'));
const template=await readFile('public/stays/property-template.html','utf8');
const escAttr=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
for(const p of properties.filter(p=>p.published)){
  const title=escAttr(`${p.name} | Contractor & Corporate Accommodation | PCCO Stays`);
  const facts=[p.postcode,p.bedrooms?`${p.bedrooms} bedroom${p.bedrooms===1?'':'s'}`:null,p.sleeps?`sleeps ${p.sleeps}`:null].filter(Boolean).join(', ');
  const description=escAttr(`${p.name}${facts?' — '+facts:''}. Furnished accommodation from PCCO Stays. Select your required dates and enquire; availability is confirmed by our accommodation team.`);
  const html=template.replaceAll('%%SLUG%%',p.slug).replaceAll('%%TITLE%%',title).replaceAll('%%DESCRIPTION%%',description);
  const dir=`dist/properties/${p.slug}`;await mkdir(dir,{recursive:true});await writeFile(`${dir}/index.html`,html);
}
console.log(`PCCO Stays built: dist/ with /, /stays/, /properties/ and ${properties.filter(p=>p.published).length} property pages`);

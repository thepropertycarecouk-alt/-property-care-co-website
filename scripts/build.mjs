import {copyFile, access, cp, mkdir, readFile, writeFile} from 'node:fs/promises';
for (const file of [
  'public/stays/index.html','public/stays/app.js','public/stays/styles.css',
  'public/stays/marketplace.css','public/stays/marketplace.js','public/stays/property-browser.js',
  'public/stays/property-page.js','public/stays/property-template.html','public/stays/properties.json','public/stays/property-index.json',
  'public/properties/index.html','public/partners/terms/index.html','public/partners/onboarding/index.html',
  'public/stays/assets/02_Transparent_Landscape_Logo.png','public/stays/assets/living-room.jpg'
]) await access(file);
await copyFile('public/stays/index.html', 'public/index.html');
await mkdir('dist', {recursive: true});
await cp('public', 'dist', {recursive: true});

console.log('PCCO Stays built; inventory is served by the acceptance-gated API.');

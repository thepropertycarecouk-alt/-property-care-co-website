import {copyFile, access, cp, mkdir, rm, readFile, writeFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
for (const file of [
  'public/stays/index.html','public/stays/app.js','public/stays/styles.css',
  'public/stays/marketplace.css','public/stays/marketplace.js','public/stays/property-browser.js',
  'public/stays/property-page.js','public/stays/property-template.html','public/stays/properties.json','public/stays/property-index.json',
  'public/properties/index.html','public/partners/terms/index.html','public/partners/onboarding/index.html',
  'public/landlords/index.html','public/landlords/landlords.css','public/landlords/landlords.js',
  'public/stays/assets/02_Transparent_Landscape_Logo.png','public/stays/assets/living-room.jpg'
]) await access(file);
await copyFile('public/stays/index.html', 'public/index.html');

async function addLandlordsNavigation(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory()){await addLandlordsNavigation(path);continue;}
    if(!entry.isFile()||!entry.name.endsWith('.html'))continue;
    let html=await readFile(path,'utf8');
    const navStart=html.indexOf('<nav id="navigation"');
    const navEnd=navStart>=0?html.indexOf('</nav>',navStart):-1;
    if(navStart<0||navEnd<0)continue;
    const navHtml=html.slice(navStart,navEnd);
    if(!navHtml.includes('href="/partners"')||navHtml.includes('href="/landlords"'))continue;
    const updatedNav=navHtml.replace(/(<a\b[^>]*href="\/partners"[^>]*>[\s\S]*?<\/a>)/,'$1<a href="/landlords">Landlords <span aria-hidden="true">↗</span></a>');
    if(updatedNav!==navHtml){html=html.slice(0,navStart)+updatedNav+html.slice(navEnd);await writeFile(path,html);}
  }
}
await addLandlordsNavigation('public');

await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive: true});
await cp('public', 'dist', {recursive: true});

console.log('PCCO Stays built; inventory is served by the acceptance-gated API.');

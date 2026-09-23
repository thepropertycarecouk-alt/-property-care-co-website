import {copyFile, access, cp, mkdir} from 'node:fs/promises';
for (const file of ['public/stays/index.html','public/stays/app.js','public/stays/styles.css','public/stays/assets/02_Transparent_Landscape_Logo.png','public/stays/assets/living-room.jpg']) await access(file);
await copyFile('public/stays/index.html', 'public/index.html');
await mkdir('dist', {recursive: true});
await cp('public', 'dist', {recursive: true});
console.log('PCCO Stays built: dist/ with / and /stays/');

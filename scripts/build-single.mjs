// Gera dist-single/grave-credit.html: build do Vite com CSS e JS embutidos num único arquivo,
// para publicar como artefato de playtest ou anexar. Rode depois de `npm run build`.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const assets = readdirSync(join(dist, 'assets'));
const js = assets.find((f) => f.endsWith('.js'));
const css = assets.find((f) => f.endsWith('.css'));
if (!js || !css) throw new Error('Rode `npm run build` antes.');
const code = readFileSync(join(dist, 'assets', js), 'utf8').replace(/<\/script/gi, '<\\/script');
const style = readFileSync(join(dist, 'assets', css), 'utf8');
const fonts =
  'https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=Spectral:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap';
const html = `<title>Grave Credit</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="${fonts}">
<style>${style}</style>
<div id="app"></div>
<script type="module">${code}</script>
`;
mkdirSync('dist-single', { recursive: true });
writeFileSync(join('dist-single', 'grave-credit.html'), html);
console.log(`dist-single/grave-credit.html (${(html.length / 1024).toFixed(1)} kB)`);

import { createGrid, createStreams, hashSeedText, nextInt, type RngState } from './core';
import { t } from './ui/strings';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('#app ausente');

const seedText = 'meia-noite';
const grid = createGrid();
let rng: RngState = createStreams(hashSeedText(seedText)).gameplay;
const draws: number[] = [];
for (let i = 0; i < 5; i++) {
  const r = nextInt(rng, 100);
  draws.push(r.value);
  rng = r.state;
}

const h1 = document.createElement('h1');
h1.textContent = t('app.title');
const tagline = document.createElement('p');
tagline.textContent = t('app.tagline');
const notice = document.createElement('p');
notice.textContent = t('foundation.notice');

const bench = document.createElement('div');
bench.className = 'bench';
bench.setAttribute('role', 'grid');
bench.setAttribute('aria-label', t('bench.label'));
bench.style.gridTemplateColumns = `repeat(${grid.cols}, 1fr)`;
for (let r = 0; r < grid.rows; r++) {
  for (let c = 0; c < grid.cols; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    cell.textContent = `${r},${c}`;
    bench.append(cell);
  }
}

const seedInfo = document.createElement('p');
seedInfo.append(
  `${t('foundation.seed')}: `,
  Object.assign(document.createElement('code'), { textContent: seedText }),
  ` — ${t('foundation.draws')}: `,
  Object.assign(document.createElement('code'), { textContent: draws.join(', ') }),
);

app.append(h1, tagline, notice, bench, seedInfo);

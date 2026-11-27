// Confere tests/fixtures/resolve/*.json contra o motor do protótipo (prototypes/sandbox-p1.html).
// Uso: node tests/fixtures/tools/check-against-prototype.mjs. Ferramenta de QA, não faz parte do npm test.
// Eventos fora do contrato (ARM, FIZZLE) são filtrados antes da comparação; ver docs/TEST_PLAN.md, C-01.
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../../../prototypes/sandbox-p1.html', import.meta.url), 'utf8');
const js = html.split('<script>')[1].split('// ================= ESTADO DA PARTIDA')[0];
const eng = new Function(js + '; return { resolveNight, CFG };')();
const dir = new URL('../resolve/', import.meta.url).pathname; let bad = 0;
const KEEP = ['START_NIGHT','ACTIVATE','GAIN_CURRENCY','CHANGE_CURSE','COPY_EFFECT','REPEAT_GAIN','DESTROY','END_NIGHT'];
for (const f of fs.readdirSync(dir).sort()) {
  const fx = JSON.parse(fs.readFileSync(dir + f, 'utf8'));
  const cells = Array(25).fill(null), inst = {};
  for (const r of fx.setup.relics) { cells[r.row*5+r.col] = r.id; inst[r.id] = { def: r.def }; }
  eng.CFG.maxEvents = fx.config?.maxEvents ?? 256;
  const res = eng.resolveNight(cells, inst, fx.setup.curse, fx.setup.destroyedThisRun);
  const log = res.log.filter(e => KEEP.includes(e.type)).map(e => {
    switch (e.type) {
      case 'START_NIGHT': return { type: e.type, night: 1 };
      case 'END_NIGHT': return { type: e.type, night: 1, truncated: e.truncated };
      case 'ACTIVATE': return { type: e.type, sourceId: e.src };
      case 'GAIN_CURRENCY': return { type: e.type, sourceId: e.src, amount: e.amount };
      case 'CHANGE_CURSE': return { type: e.type, sourceId: e.src, delta: e.delta };
      case 'COPY_EFFECT': return { type: e.type, sourceId: e.src, targetId: e.target, amount: e.amount };
      case 'REPEAT_GAIN': return { type: e.type, sourceId: e.src, amount: e.amount };
      case 'DESTROY': return { type: e.type, sourceId: e.src, targetId: e.target };
    }
  });
  const got = { log, gain: res.gain, curse: res.curse, defeat: res.defeat, truncated: res.truncated, destroyed: res.destroyed };
  const ok = JSON.stringify(got) === JSON.stringify(fx.expected);
  if (!ok) { bad++; console.log('FALHA', fx.id); console.log(' esperado', JSON.stringify(fx.expected)); console.log(' obtido  ', JSON.stringify(got)); }
}
console.log(bad ? `${bad} divergências` : 'todas as fixtures conferem com o protótipo');

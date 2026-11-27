/**
 * UI placeholder jogável (P1-005). Só apresenta estado e reproduz o log do motor;
 * toda regra vem de src/core. A animação é cosmética: pular ou acelerar não muda nada.
 */
import {
  applyAction,
  createGrid,
  createRun,
  curseBand,
  DEFAULT_CONFIG,
  inBounds,
  neighbors,
  previewNight,
  RELIC_IDS,
  RELICS,
  resolveNight,
  sellPrice,
  tributeFor,
  type Action,
  type GameEvent,
  type Grid,
  type InstanceId,
  type NightResult,
  type RelicId,
  type RelicInstance,
  type RunState,
} from '../core';
import { NO_EFFECT_TEXT, RARITY_TEXT, RELIC_TEXT, t } from './strings';

type Mode = 'run' | 'lab';

interface LabState {
  grid: Grid;
  instances: Record<InstanceId, RelicInstance>;
  nextId: number;
  curse: number;
  destroyedThisRun: number;
  result: NightResult | null;
}

interface Playback {
  events: readonly GameEvent[];
  instances: Readonly<Record<InstanceId, RelicInstance>>;
  grid: Grid;
}

const SIZE = DEFAULT_CONFIG.gridSize;
const rc = (i: number) => ({ row: Math.floor(i / SIZE), col: i % SIZE });
const idx = (c: { row: number; col: number }) => c.row * SIZE + c.col;

const PRESETS: Record<string, { name: string; curse: number; cells: Record<string, RelicId> }> = {
  combo60: {
    name: 'Combo de 60 (duas velas + fio)',
    curse: 0,
    cells: { '0,0': 'skull', '0,1': 'mirror', '1,0': 'bell', '1,1': 'candle', '1,2': 'skull', '2,1': 'eye', '3,3': 'candle', '3,4': 'thread', '2,4': 'hourglass' },
  },
  tutorial: { name: 'Tutorial: vela ao lado do crânio', curse: 0, cells: { '2,1': 'candle', '2,2': 'skull', '0,4': 'feather' } },
  book30: { name: 'Livro na faixa 30 (+25%) com olho', curse: 30, cells: { '2,2': 'candle', '2,3': 'book', '1,2': 'eye' } },
  ring: { name: 'Anel, moeda e dente', curse: 0, cells: { '2,2': 'candle', '2,3': 'ring', '2,4': 'coin', '3,2': 'tooth', '1,2': 'thread', '0,2': 'skull' } },
  doom: { name: 'Maldição 92 + livro = derrota', curse: 92, cells: { '2,2': 'candle', '2,3': 'book', '2,1': 'skull' } },
};

function randomSeedText(): string {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return 'noite-' + (a[0] ?? 0).toString(36);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string | number): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = String(text);
  return e;
}

export function mountApp(root: HTMLElement): void {
  let mode: Mode = 'run';
  let run: RunState = createRun('meia-noite');
  let lab: LabState = emptyLab();
  let sel: number | null = null;
  let focusIdx: number | null = null;
  let playing = false;
  let labPick: RelicId = 'candle';
  let playback: Playback | null = null;
  let activeSeq: number | null = null;
  let flashes = new Map<number, string>();
  let notice: string | null = null;
  loadPreset('combo60');

  function emptyLab(): LabState {
    return { grid: createGrid(SIZE), instances: {}, nextId: 1, curse: 0, destroyedThisRun: 0, result: null };
  }
  function loadPreset(key: string): void {
    const p = PRESETS[key];
    if (!p) return;
    lab = emptyLab();
    lab.curse = p.curse;
    const cells = lab.grid.cells.slice();
    for (const [k, relic] of Object.entries(p.cells)) {
      const [row, col] = k.split(',').map(Number) as [number, number];
      const id = lab.nextId++;
      lab.instances[id] = { relic };
      cells[idx({ row, col })] = id;
    }
    lab.grid = { ...lab.grid, cells };
  }

  // ---------- esqueleto ----------
  root.innerHTML = '';
  const wrap = el('div', 'wrap');
  const header = el('header', 'top');
  const titleBox = el('div');
  titleBox.append(el('h1', '', t('app.title')), el('p', 'sub', `${t('app.prototype')} ${t('app.tagline')}`));
  const tabs = el('div', 'tabs');
  tabs.setAttribute('role', 'tablist');
  const tabRun = el('button', 'tab', t('tab.run'));
  const tabLab = el('button', 'tab', t('tab.lab'));
  for (const b of [tabRun, tabLab]) b.setAttribute('role', 'tab');
  tabs.append(tabRun, tabLab);
  header.append(titleBox, tabs);

  const ledger = el('div', 'ledger');
  ledger.setAttribute('aria-live', 'polite');
  const cell = (k: string) => {
    const d = el('div');
    const key = el('span', 'k', k);
    const v = el('span', 'v');
    d.append(key, v);
    return { d, key, v };
  };
  const lNight = cell(t('ledger.night'));
  const lBal = cell(t('ledger.balance'));
  const lTrib = cell(t('ledger.tribute'));
  const lCurse = cell(t('ledger.curse'));
  const bar = el('div', 'curse-bar');
  const fill = el('i');
  bar.append(fill);
  const bandEl = el('span', 'band');
  lCurse.d.append(bar, bandEl);
  ledger.append(lNight.d, lBal.d, lTrib.d, lCurse.d);

  const main = el('div', 'main');
  const benchBox = el('div', 'benchbox');
  const banner = el('div');
  const bench = el('div', 'bench');
  bench.setAttribute('role', 'grid');
  bench.setAttribute('aria-label', t('bench.label'));
  const preview = el('div', 'preview');
  const actions = el('div', 'actions');
  const bellBtn = el('button', 'bell', t('action.ring'));
  const undoBtn = el('button', 'btn', t('action.undo'));
  const sellBtn = el('button', 'btn', t('action.sell'));
  const speedLabel = el('label', 'hint', t('action.speed'));
  speedLabel.htmlFor = 'speed';
  const speed = el('select', 'btn');
  speed.id = 'speed';
  for (const [v, label] of [['1', '1×'], ['2', '2×'], ['0', t('speed.instant')]] as const) {
    const o = el('option', '', label);
    o.value = v;
    speed.append(o);
  }
  speed.value = '2';
  actions.append(bellBtn, undoBtn, sellBtn, speedLabel, speed);
  const logPanel = el('div', 'panel');
  const logBox = el('div', 'log');
  logPanel.append(el('h2', '', t('log.title')), logBox);
  benchBox.append(banner, bench, preview, actions, logPanel);
  const side = el('aside', 'panel');
  main.append(benchBox, side);
  wrap.append(header, ledger, main, el('p', 'foot', t('foot')));
  root.append(wrap);

  // ---------- helpers de estado ----------
  const curGrid = () => (mode === 'run' ? run.grid : lab.grid);
  const curInstances = () => (mode === 'run' ? run.instances : lab.instances);
  const curCurse = () => (mode === 'run' ? run.curse : lab.curse);
  const relicAt = (i: number): RelicId | null => {
    const id = curGrid().cells[i];
    return id == null ? null : (curInstances()[id]?.relic ?? null);
  };
  const labPreview = () =>
    resolveNight({ grid: lab.grid, instances: lab.instances, curse: lab.curse, destroyedThisRun: lab.destroyedThisRun, night: 1 });

  function act(a: Action): boolean {
    const r = applyAction(run, a);
    if (!r.ok) {
      notice = `Ação recusada: ${r.error}`;
      return false;
    }
    run = r.value;
    notice = null;
    return true;
  }

  function nameOf(id: InstanceId, inst: Readonly<Record<InstanceId, RelicInstance>>): string {
    const r = inst[id];
    return r ? `${RELIC_TEXT[r.relic].name} #${id}` : `#${id}`;
  }

  function logLine(e: GameEvent, inst: Readonly<Record<InstanceId, RelicInstance>>): [string, string] {
    const n = (id: InstanceId) => nameOf(id, inst);
    switch (e.type) {
      case 'START_NIGHT':
        return ['m', `Noite ${e.night}. Relíquias de início entram na fila em ordem de leitura.`];
      case 'ACTIVATE':
        return ['', `${n(e.sourceId)} desperta${e.byId !== null ? ` (por ${n(e.byId)})` : ''}`];
      case 'GAIN_CURRENCY': {
        const parts = [`${e.base}`];
        if (e.abyssBonus) parts.push(`+${e.abyssBonus} abissal`);
        if (e.doubledBy !== null) parts.push(`×2 olho #${e.doubledBy}`);
        return ['g', `  +${e.amount} óbolos [${parts.join(' ')}]`];
      }
      case 'COPY_EFFECT':
        return ['g', `  +${e.amount} cópia de ${n(e.targetId)}`];
      case 'REPEAT_GAIN':
        return ['g', `  +${e.amount} repetição do último ganho`];
      case 'CHANGE_CURSE':
        return ['c', `  maldição ${e.delta >= 0 ? '+' : ''}${e.delta} → ${e.curse}`];
      case 'ARM_MULTIPLIER':
        return ['c', '  olho preparado: próximo ganho direto de outra relíquia ×2'];
      case 'DESTROY':
        return ['x', `  destrói ${n(e.targetId)}`];
      case 'NO_EFFECT':
        return ['m', `  sem efeito: ${NO_EFFECT_TEXT[e.reason]}`];
      case 'END_NIGHT':
        return e.outcome === 'curse_defeat'
          ? ['x', 'A maldição chegou a 100. Eventos restantes descartados.']
          : e.outcome === 'truncated'
            ? ['x', 'Limite de ativações atingido (defeito de design).']
            : ['m', 'Fim da resolução.'];
    }
  }

  function reachOf(i: number): number[] {
    const relic = relicAt(i);
    if (!relic) return [];
    const c = rc(i);
    const g = curGrid();
    if (relic === 'mirror') return inBounds(g, { row: c.row, col: c.col - 1 }) ? [i - 1] : [];
    if (relic === 'bell') return g.cells.flatMap((id, j) => (id != null && curInstances()[id]?.relic === 'skull' ? [j] : []));
    if (relic === 'candle' || relic === 'thread' || relic === 'ring') return neighbors(g, c).map((n) => idx(n.coord));
    return [];
  }

  function startOrder(): Map<InstanceId, number> {
    const m = new Map<InstanceId, number>();
    let n = 1;
    for (const id of curGrid().cells) if (id != null && RELICS[curInstances()[id]!.relic].trigger === 'start') m.set(id, n++);
    return m;
  }

  // ---------- render ----------
  function render(): void {
    tabRun.setAttribute('aria-selected', String(mode === 'run'));
    tabLab.setAttribute('aria-selected', String(mode === 'lab'));
    const curse = curCurse();
    if (mode === 'run') {
      lNight.key.textContent = t('ledger.night');
      lNight.v.textContent = `${run.night} / ${DEFAULT_CONFIG.tributes.length}`;
      lBal.key.textContent = t('ledger.balance');
      lBal.v.textContent = String(run.balance);
      lTrib.v.textContent = String(tributeFor(run));
    } else {
      lNight.key.textContent = t('ledger.mode');
      lNight.v.textContent = 'lab';
      lBal.key.textContent = t('ledger.labGain');
      lBal.v.textContent = lab.result ? String(lab.result.gain) : '–';
      lTrib.v.textContent = '–';
    }
    lCurse.v.textContent = String(curse);
    fill.style.width = `${curse}%`;
    bandEl.textContent = t(`band.${curseBand(curse).id}`);
    renderBench();
    renderPreview();
    renderSide();
    renderBanner();
    renderLog();
    const locked = playing || (mode === 'run' && run.phase !== 'organize');
    bellBtn.disabled = locked;
    undoBtn.hidden = sellBtn.hidden = mode !== 'run';
    undoBtn.disabled = locked || run.undoStack.length === 0;
    const selRelic = sel != null ? relicAt(sel) : null;
    sellBtn.disabled = locked || selRelic == null;
    sellBtn.textContent = selRelic && mode === 'run' ? `${t('action.sell')} (+${sellPrice(selRelic)})` : t('action.sell');
  }

  function renderBench(): void {
    bench.textContent = '';
    const grid = playback && playing ? playback.grid : curGrid();
    const inst = playback && playing ? playback.instances : curInstances();
    const order = startOrder();
    const reach = sel != null ? reachOf(sel) : [];
    grid.cells.forEach((id, i) => {
      const c = rc(i);
      const b = el('button', 'cell');
      b.setAttribute('role', 'gridcell');
      b.dataset['i'] = String(i);
      const relic = id != null ? inst[id]?.relic : undefined;
      if (id != null && relic) {
        const tx = RELIC_TEXT[relic];
        b.classList.add('filled');
        b.append(el('span', 'glyph', tx.glyph), el('span', 'nm', tx.name));
        const ord = order.get(id);
        if (ord) b.append(el('span', 'ord', ord));
        if (RELICS[relic].trigger === 'start') b.append(el('span', 'trig', t('bench.start')));
        b.setAttribute('aria-label', `Linha ${c.row + 1}, coluna ${c.col + 1}: ${tx.name}${ord ? `, início ordem ${ord}` : ''}`);
      } else b.setAttribute('aria-label', `Linha ${c.row + 1}, coluna ${c.col + 1}: ${t('bench.empty')}`);
      if (sel === i) b.classList.add('sel');
      if (reach.includes(i)) b.classList.add('target');
      const fl = flashes.get(i);
      if (fl) b.classList.add('flash', fl);
      b.addEventListener('click', () => onCell(i));
      bench.append(b);
    });
    if (focusIdx != null) {
      (bench.children[focusIdx] as HTMLElement | undefined)?.focus();
      focusIdx = null;
    }
  }

  function renderPreview(): void {
    preview.textContent = '';
    if (playing) {
      preview.append(el('span', '', t('preview.resolving')));
      return;
    }
    if (mode === 'run' && run.phase !== 'organize') return;
    const res = mode === 'run' ? previewNight(run) : labPreview();
    const add = (label: string, val: string, cls = '') => {
      const s = el('span', '', `${label} `);
      s.append(el('b', cls, val));
      preview.append(s);
    };
    const defeat = res.outcome === 'curse_defeat';
    add(t('preview.gain'), `+${res.gain}`);
    add(t('preview.curse'), `${curCurse()} → ${res.curse}`, defeat ? 'bad' : '');
    if (mode === 'run') {
      const after = run.balance + res.gain - tributeFor(run);
      add(t('preview.after'), defeat ? t('preview.defeat') : String(after), defeat || after < 0 ? 'bad' : 'ok');
    }
    if (res.destroyedIds.length)
      add(t('preview.destroyed'), res.destroyedIds.map((id) => RELIC_TEXT[curInstances()[id]!.relic].glyph).join(', '), 'bad');
  }

  function offerButton(relic: RelicId, priceLabel: string, disabled: boolean, onClick: () => void, soldOut = false): HTMLButtonElement {
    const tx = RELIC_TEXT[relic];
    const b = el('button', 'offer');
    b.disabled = disabled;
    const mid = el('div');
    const title = el('div', 't', soldOut ? `${tx.name} (${t('market.sold')})` : tx.name);
    title.append(el('span', `rar ${RELICS[relic].rarity}`, RARITY_TEXT[RELICS[relic].rarity]));
    mid.append(title, el('div', 'd', tx.desc));
    b.append(el('span', 'glyph', tx.glyph), mid, el('span', 'p', priceLabel));
    b.addEventListener('click', onClick);
    return b;
  }

  function renderSide(): void {
    side.textContent = '';
    if (mode === 'run') {
      if (run.phase === 'organize') {
        side.append(el('h2', '', t('market.title')), el('p', 'hint', t('market.hint')));
        const list = el('div', 'offers');
        const noRoom = !run.grid.cells.includes(null);
        run.market.forEach((o, k) => {
          const price = RELICS[o.relic].price;
          list.append(
            offerButton(o.relic, `${price} ób`, o.sold || run.balance < price || noRoom || playing, () => {
              const at = sel != null && run.grid.cells[sel] == null ? rc(sel) : undefined;
              if (act(at ? { type: 'buy', offer: k, at } : { type: 'buy', offer: k })) sel = null;
              render();
            }, o.sold),
          );
        });
        side.append(list);
        const rr = el('button', 'btn', `${t('market.reroll')} (${run.rerollCost} ób)`);
        rr.disabled = run.balance < run.rerollCost || playing;
        rr.addEventListener('click', () => {
          act({ type: 'reroll' });
          render();
        });
        side.append(rr);
      } else if (run.phase === 'reward') {
        side.append(el('h2', '', t('reward.title')), el('p', 'hint', run.rewardOptions.length ? t('reward.pick') : t('reward.full')));
        const list = el('div', 'offers');
        run.rewardOptions.forEach((relic, k) =>
          list.append(offerButton(relic, t('reward.free'), playing, () => {
            act({ type: 'chooseReward', index: k });
            playback = null;
            render();
          })),
        );
        side.append(list);
        const skip = el('button', 'btn', t('reward.skip'));
        skip.disabled = playing;
        skip.addEventListener('click', () => {
          act({ type: 'skipReward' });
          playback = null;
          render();
        });
        side.append(skip);
      } else side.append(el('h2', '', t('over.title')), el('p', 'hint', t('over.hint')));

      const row = el('div', 'row');
      const lbl = el('label', '', t('seed.label'));
      lbl.htmlFor = 'seed';
      const inp = el('input');
      inp.type = 'text';
      inp.id = 'seed';
      inp.value = run.seedText;
      inp.style.width = '11em';
      const go = el('button', 'btn', t('seed.restart'));
      go.addEventListener('click', () => newRun(inp.value.trim() || randomSeedText()));
      const rnd = el('button', 'btn', t('seed.new'));
      rnd.addEventListener('click', () => newRun(randomSeedText()));
      row.append(lbl, inp, go, rnd);
      side.append(row);
    } else {
      side.append(el('h2', '', t('lab.title')), el('p', 'hint', t('lab.hint')));
      const pal = el('div', 'palette');
      for (const r of RELIC_IDS) {
        const b = el('button');
        b.setAttribute('aria-pressed', String(labPick === r));
        b.append(el('span', 'glyph', RELIC_TEXT[r].glyph), el('span', '', RELIC_TEXT[r].name));
        b.addEventListener('click', () => {
          labPick = r;
          sel = null;
          render();
        });
        pal.append(b);
      }
      side.append(pal);
      const row = el('div', 'row');
      const num = (id: string, label: string, value: number, max: number, set: (n: number) => void) => {
        const l = el('label', '', label);
        l.htmlFor = id;
        const i = el('input');
        i.type = 'number';
        i.id = id;
        i.min = '0';
        i.max = String(max);
        i.value = String(value);
        i.addEventListener('change', () => {
          set(Math.max(0, Math.min(max, Math.floor(Number(i.value) || 0))));
          lab.result = null;
          render();
        });
        row.append(l, i);
      };
      num('labcurse', t('lab.curse'), lab.curse, 99, (n) => (lab.curse = n));
      num('labdes', t('lab.destroyed'), lab.destroyedThisRun, 50, (n) => (lab.destroyedThisRun = n));
      side.append(row);
      const pr = el('div', 'row');
      const ps = el('select', 'btn');
      ps.id = 'preset';
      const o0 = el('option', '', t('lab.preset'));
      o0.value = '';
      ps.append(o0);
      for (const [k, p] of Object.entries(PRESETS)) {
        const o = el('option', '', p.name);
        o.value = k;
        ps.append(o);
      }
      ps.addEventListener('change', () => {
        if (ps.value) {
          loadPreset(ps.value);
          sel = null;
          playback = null;
          render();
        }
      });
      const clr = el('button', 'btn', t('lab.clear'));
      clr.addEventListener('click', () => {
        lab = emptyLab();
        sel = null;
        playback = null;
        render();
      });
      pr.append(ps, clr);
      side.append(pr);
    }
    const det = el('div', 'detail');
    const r = sel != null ? relicAt(sel) : null;
    if (r) {
      const d = RELICS[r];
      det.append(el('b', '', RELIC_TEXT[r].name), ` · ${RARITY_TEXT[d.rarity]} · ${t(d.trigger === 'start' ? 'trigger.start' : 'trigger.wake')}`, el('br'), RELIC_TEXT[r].desc);
    } else det.append(el('span', 'hint', t('detail.none')));
    side.append(det);
  }

  function renderBanner(): void {
    banner.textContent = '';
    const box = (title: string, body: string, lose: boolean, again: boolean) => {
      const b = el('div', `banner${lose ? ' lose' : ''}`);
      b.append(el('h3', '', title), el('p', 'hint', body));
      if (again) {
        const btn = el('button', 'btn', t('again'));
        btn.addEventListener('click', () => newRun(randomSeedText()));
        b.append(btn);
      }
      banner.append(b);
    };
    if (playing) return;
    if (notice) {
      box(notice, '', true, false);
      return;
    }
    if (mode === 'run') {
      const n = run.lastNight;
      if (run.phase === 'lost' && n) {
        if (run.lossReason === 'curse') box('A loja cobrou em carne', `A maldição chegou a 100 na noite ${n.night}. Seed ${run.seedText}.`, true, true);
        else box('Dívida não paga', `Faltaram ${n.tribute - run.balance} óbolos para o tributo de ${n.tribute} na noite ${n.night}. Seed ${run.seedText}.`, true, true);
      } else if (run.phase === 'won') {
        box('Contrato cumprido', `Você pagou as cinco noites e saiu com ${run.balance} óbolos e maldição ${run.curse}. Seed ${run.seedText}.`, false, true);
      } else if (run.phase === 'reward' && n) {
        box(`Tributo de ${n.tribute} pago`, `A noite rendeu ${n.gain} óbolos. Saldo ${run.balance}.`, false, false);
      }
    } else if (lab.result) {
      const r = lab.result;
      box(
        r.outcome === 'curse_defeat' ? 'Derrota: a maldição chegou a 100' : `Ganho total: ${r.gain} óbolos`,
        `Maldição ${lab.curse} → ${r.curse}. ${r.events.length} eventos no log.`,
        r.outcome === 'curse_defeat',
        false,
      );
    }
  }

  function renderLog(): void {
    logBox.textContent = '';
    if (!playback) {
      logBox.append(el('div', 'm', t('log.empty')));
      return;
    }
    for (const e of playback.events) {
      if (activeSeq != null && e.seq > activeSeq) break;
      const [cls, txt] = logLine(e, playback.instances);
      const d = el('div', cls, txt);
      if (e.seq === activeSeq) d.classList.add('now');
      logBox.append(d);
    }
    logBox.scrollTop = logBox.scrollHeight;
  }

  // ---------- interações ----------
  function newRun(seed: string): void {
    run = createRun(seed);
    sel = null;
    playback = null;
    notice = null;
    render();
  }

  function onCell(i: number): void {
    if (playing) return;
    focusIdx = i;
    notice = null;
    if (mode === 'run' && run.phase !== 'organize') return;
    const g = curGrid();
    if (mode === 'lab' && sel == null && g.cells[i] == null) {
      const id = lab.nextId++;
      lab.instances[id] = { relic: labPick };
      const cells = g.cells.slice();
      cells[i] = id;
      lab.grid = { ...g, cells };
      lab.result = null;
      render();
      return;
    }
    if (sel == null || g.cells[sel] == null) {
      sel = i;
      render();
      return;
    }
    if (sel === i) {
      if (mode === 'lab') {
        const id = g.cells[i]!;
        delete lab.instances[id];
        const cells = g.cells.slice();
        cells[i] = null;
        lab.grid = { ...g, cells };
        lab.result = null;
      }
      sel = null;
      render();
      return;
    }
    if (mode === 'run') act({ type: 'move', from: rc(sel), to: rc(i) });
    else {
      const cells = g.cells.slice();
      [cells[sel], cells[i]] = [cells[i] ?? null, cells[sel] ?? null];
      lab.grid = { ...g, cells };
      lab.result = null;
    }
    sel = null;
    render();
  }

  async function ringBell(): Promise<void> {
    sel = null;
    notice = null;
    let events: readonly GameEvent[];
    const before: Playback = { events: [], instances: { ...curInstances() }, grid: curGrid() };
    if (mode === 'run') {
      if (!act({ type: 'ring' })) return render();
      events = run.lastNight?.events ?? [];
    } else {
      lab.result = labPreview();
      events = lab.result.events;
    }
    playback = { ...before, events };
    const sp = Number(speed.value);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sp > 0) {
      playing = true;
      const delay = (reduce ? 120 : 380) / sp;
      let grid = before.grid;
      for (const e of events) {
        activeSeq = e.seq;
        flashes = new Map();
        const hit = (id: InstanceId, cls: string) => {
          const p = grid.cells.indexOf(id);
          if (p >= 0) flashes.set(p, cls);
        };
        if ('sourceId' in e) hit(e.sourceId, e.type === 'CHANGE_CURSE' ? 'flash-curse' : /GAIN|COPY|REPEAT/.test(e.type) ? 'flash-gain' : 'flash');
        if (e.type === 'COPY_EFFECT') hit(e.targetId, 'flash-gain');
        if (e.type === 'DESTROY') {
          hit(e.targetId, 'flash-destroy');
          playback = { ...playback, grid };
        }
        render();
        if (e.type === 'DESTROY') {
          const cells = grid.cells.slice();
          cells[cells.indexOf(e.targetId)] = null;
          grid = { ...grid, cells };
          playback = { ...playback, grid };
        }
        await new Promise((r) => setTimeout(r, delay));
      }
      playing = false;
      flashes = new Map();
      activeSeq = null;
    }
    render();
  }

  bellBtn.addEventListener('click', () => void ringBell());
  undoBtn.addEventListener('click', () => {
    act({ type: 'undo' });
    sel = null;
    render();
  });
  sellBtn.addEventListener('click', () => {
    if (sel != null && act({ type: 'sell', at: rc(sel) })) sel = null;
    render();
  });
  tabRun.addEventListener('click', () => {
    if (playing) return;
    mode = 'run';
    sel = null;
    playback = null;
    render();
  });
  tabLab.addEventListener('click', () => {
    if (playing) return;
    mode = 'lab';
    sel = null;
    playback = null;
    render();
  });
  bench.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    const i = Number(target.dataset['i']);
    if (Number.isNaN(i)) return;
    const c = rc(i);
    const delta: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const d = delta[e.key];
    if (!d) return;
    const n = { row: c.row + d[0], col: c.col + d[1] };
    if (!inBounds(curGrid(), n)) return;
    e.preventDefault();
    (bench.children[idx(n)] as HTMLElement).focus();
  });

  render();
  // Gancho para testes E2E/inspeção manual; não é API do jogo.
  (window as unknown as { __graveCredit?: unknown }).__graveCredit = { get run() { return run; } };
}

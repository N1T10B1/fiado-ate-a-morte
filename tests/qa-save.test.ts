/**
 * QA (P1-006): casos de save/reload além de tests/save.test.ts. Ver docs/TEST_PLAN.md §11.
 * Partidas geradas por política fixa (sem Math.random): cada passo grava, recarrega e segue
 * do estado recarregado; o fim tem de ser idêntico ao da partida sem recarga.
 */
import { describe, expect, it } from 'vitest';
import { applyAction, createRun, type Action, type RunState } from '../src/core/run';
import { BACKUP_KEY, loadRun, parse, SAVE_KEY, saveRun, serialize, type KeyValueStore } from '../src/persistence/save';

function memStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

/** Política determinística: compra a primeira oferta que couber, toca o sino, aceita a 1ª recompensa. */
function nextAction(s: RunState): Action | null {
  if (s.phase === 'reward') return s.rewardOptions.length ? { type: 'chooseReward', index: 0 } : { type: 'skipReward' };
  if (s.phase !== 'organize') return null;
  for (let i = 0; i < s.market.length; i++) {
    if (applyAction(s, { type: 'buy', offer: i }).ok) return { type: 'buy', offer: i };
  }
  return { type: 'ring' };
}

function play(seed: string, reloadEachStep: boolean): { final: RunState; phases: Set<string>; steps: number } {
  const store = memStore();
  let s = createRun(seed);
  const phases = new Set<string>([s.phase]);
  let steps = 0;
  for (let a = nextAction(s); a && steps < 200; a = nextAction(s), steps++) {
    const r = applyAction(s, a);
    if (!r.ok) throw new Error(`${seed}: ${a.type} → ${r.error}`);
    s = r.value;
    phases.add(s.phase);
    if (reloadEachStep) {
      expect(saveRun(store, s)).toBe(true);
      const l = loadRun(store);
      expect(l.status, `${seed} passo ${steps}`).toBe('ok');
      if (l.status !== 'ok') throw new Error('load');
      expect(l.state).toEqual(s);
      s = l.state;
    }
  }
  return { final: s, phases, steps };
}

const SEEDS = Array.from({ length: 12 }, (_, i) => `qa-save-${i}`);

describe('QA — save: recarregar a cada passo não muda a partida', () => {
  it.each(SEEDS)('%s', (seed) => {
    const plain = play(seed, false);
    const reloaded = play(seed, true);
    expect(reloaded.final).toEqual(plain.final);
    expect(['won', 'lost']).toContain(plain.final.phase);
  });

  it('as partidas de teste passam por organização, recompensa e pelo menos um fim', () => {
    const all = new Set<string>();
    for (const seed of SEEDS) for (const p of play(seed, false).phases) all.add(p);
    expect(all.has('organize') && all.has('reward')).toBe(true);
    expect(all.has('won') || all.has('lost')).toBe(true);
  });
});

describe('QA — save: recompensa e mercado não se renovam ao recarregar', () => {
  it('opções de recompensa e PRNG são os mesmos depois do reload (sem farm de recompensa)', () => {
    let s = createRun('qa-save-reward');
    s = (applyAction(s, { type: 'ring' }) as { ok: true; value: RunState }).value;
    expect(s.phase).toBe('reward');
    const store = memStore();
    saveRun(store, s);
    for (let i = 0; i < 3; i++) {
      const l = loadRun(store);
      expect(l.status).toBe('ok');
      if (l.status === 'ok') {
        expect(l.state.rewardOptions).toEqual(s.rewardOptions);
        expect(l.state.rng).toEqual(s.rng);
        expect(l.state.balance).toBe(s.balance);
      }
    }
  });
});

describe('QA — save danificado', () => {
  const good = (): RunState => createRun('qa-save-corrupt');
  const withState = (patch: (s: Record<string, unknown>) => void): string => {
    const env = JSON.parse(serialize(good())) as { state: Record<string, unknown> };
    patch(env.state);
    return JSON.stringify(env);
  };

  const cases: [string, string][] = [
    ['JSON truncado', serialize(createRun('x')).slice(0, 40)],
    ['null', 'null'],
    ['array', '[]'],
    ['string', '"save"'],
    ['sem schemaVersion', JSON.stringify({ rulesVersion: 'p1-0.1', state: {} })],
    ['schemaVersion 0', JSON.stringify({ schemaVersion: 0 })],
    ['schemaVersion 1.5', JSON.stringify({ schemaVersion: 1.5 })],
    ['schemaVersion "1"', JSON.stringify({ schemaVersion: '1' })],
    ['maldição 101', withState((s) => (s['curse'] = 101))],
    ['maldição negativa', withState((s) => (s['curse'] = -1))],
    ['saldo negativo', withState((s) => (s['balance'] = -1))],
    ['saldo fracionário', withState((s) => (s['balance'] = 1.5))],
    ['saldo acima do teto', withState((s) => (s['balance'] = 1_000_000_001))],
    ['noite 0', withState((s) => (s['night'] = 0))],
    ['noite 6', withState((s) => (s['night'] = 6))],
    ['fase desconhecida', withState((s) => (s['phase'] = 'over'))],
    ['PRNG zerado', withState((s) => (s['rng'] = { s: 0 }))],
    ['seed ausente', withState((s) => delete s['seedText'])],
    ['ID duplicado na grade', withState((s) => {
      const g = s['grid'] as { cells: (number | null)[] };
      g.cells[0] = g.cells.find((c) => c !== null) ?? 1;
    })],
    ['instância órfã', withState((s) => ((s['instances'] as Record<string, unknown>)['99'] = { relic: 'skull' }))],
    ['relíquia desconhecida', withState((s) => ((s['instances'] as Record<string, { relic: string }>)['1'] = { relic: 'dragon' }))],
    ['nextId não maior que os IDs', withState((s) => (s['nextId'] = 1))],
    ['grade 4×4', withState((s) => ((s['grid'] as { rows: number }).rows = 4))],
    ['mercado com relíquia desconhecida', withState((s) => (s['market'] = [{ relic: 'dragon', sold: false }]))],
    ['undo com instância inexistente', withState((s) => (s['undoStack'] = [{ rows: 5, cols: 5, cells: [77, ...Array<null>(24).fill(null)] }]))],
    ['undo que não é grade', withState((s) => (s['undoStack'] = ['x']))],
    ['oferta com sold não booleano', withState((s) => ((s['market'] as { sold: unknown }[])[0]!.sold = 'yes'))],
    ['lastNight sem forma', withState((s) => (s['lastNight'] = { garbage: 1 }))],
  ];

  it.each(cases)('%s → corrupt, original guardado no backup, partida nova possível', (_name, raw) => {
    expect(parse(raw).status).toBe('corrupt');
    const store = memStore();
    store.setItem(SAVE_KEY, raw);
    expect(loadRun(store).status).toBe('corrupt');
    expect(store.data.get(BACKUP_KEY)).toBe(raw);
    expect(store.data.has(SAVE_KEY)).toBe(false);
    expect(saveRun(store, createRun('nova'))).toBe(true);
    expect(loadRun(store).status).toBe('ok');
  });

  it('schema do futuro e regras diferentes → incompatible, com backup', () => {
    const fut = JSON.stringify({ schemaVersion: 2, rulesVersion: 'p9', state: {} });
    const old = withState(() => undefined).replace('"rulesVersion":"p1-0.1"', '"rulesVersion":"p0-old"');
    for (const raw of [fut, old]) {
      const store = memStore();
      store.setItem(SAVE_KEY, raw);
      expect(loadRun(store).status).toBe('incompatible');
      expect(store.data.get(BACKUP_KEY)).toBe(raw);
    }
  });

  it('falha de gravação devolve false e não altera o save anterior', () => {
    const store = memStore();
    saveRun(store, good());
    const before = store.data.get(SAVE_KEY);
    const broken: KeyValueStore = { ...store, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(saveRun(broken, createRun('outra'))).toBe(false);
    expect(store.data.get(SAVE_KEY)).toBe(before);
  });
});

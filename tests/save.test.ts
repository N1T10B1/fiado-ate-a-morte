import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/core/config';
import { applyAction, createRun, type Action, type RunState } from '../src/core/run';
import { BACKUP_KEY, loadRun, parse, SAVE_KEY, saveRun, serialize, type KeyValueStore } from '../src/persistence/save';

function memStore(init: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(init));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}
const must = (s: RunState, a: Action) => {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('save', () => {
  it('ida e volta preserva o estado inteiro, inclusive o PRNG', () => {
    const st = memStore();
    let s = must(createRun('save'), { type: 'reroll' });
    s = must(s, { type: 'ring' });
    expect(saveRun(st, s)).toBe(true);
    const r = loadRun(st);
    expect(r).toEqual({ status: 'ok', state: s });
    // continuar a partida após carregar dá o mesmo resultado que continuar sem recarregar
    const a = must(s, { type: 'skipReward' });
    const b = must((r as { state: RunState }).state, { type: 'skipReward' });
    expect(b).toEqual(a);
  });

  it('recarregar durante a animação não paga o tributo duas vezes', () => {
    const st = memStore();
    const before = createRun('reload');
    const after = must(before, { type: 'ring' }); // resolução já gravada no estado
    saveRun(st, after);
    const loaded = loadRun(st);
    expect(loaded.status).toBe('ok');
    const s = (loaded as { state: RunState }).state;
    expect(s.phase).toBe('reward');
    expect(s.balance).toBe(after.balance);
    expect(applyAction(s, { type: 'ring' })).toEqual({ ok: false, error: 'wrong_phase' });
  });

  it('save vazio', () => {
    expect(loadRun(memStore())).toEqual({ status: 'empty' });
  });

  it.each([
    ['JSON inválido', '{nope'],
    ['não objeto', '42'],
    ['sem versão', JSON.stringify({ state: {} })],
    ['estado sem campos', JSON.stringify({ schemaVersion: 1, rulesVersion: 'p1-0.1', state: {} })],
  ])('corrompido (%s): vai para backup, nunca é perdido', (_, raw) => {
    const st = memStore({ [SAVE_KEY]: raw });
    const r = loadRun(st);
    expect(r.status).toBe('corrupt');
    expect(st.data.get(BACKUP_KEY)).toBe(raw);
    expect(st.data.has(SAVE_KEY)).toBe(false);
  });

  it('invariantes violadas são detectadas', () => {
    const s = createRun('inv');
    const bad = (patch: Partial<RunState>) => parse(serialize({ ...s, ...patch })).status;
    expect(bad({ balance: -1 })).toBe('corrupt');
    expect(bad({ balance: DEFAULT_CONFIG.maxBalance + 1 })).toBe('corrupt');
    expect(bad({ curse: 101 })).toBe('corrupt');
    expect(bad({ night: 6 })).toBe('corrupt');
    expect(bad({ rng: { s: 0 } })).toBe('corrupt');
    expect(bad({ nextId: 1 })).toBe('corrupt');
    const dup = s.grid.cells.slice();
    dup[24] = dup[11] ?? null;
    expect(bad({ grid: { ...s.grid, cells: dup } })).toBe('corrupt');
    expect(bad({ instances: { ...s.instances, 99: { relic: 'skull' } } })).toBe('corrupt');
    expect(bad({ instances: { ...s.instances, 2: { relic: 'dragon' as 'skull' } } })).toBe('corrupt');
  });

  it('lacunas apontadas pelo QA: desfazer, mercado e resumo da noite são validados', () => {
    const moved = must(createRun('qa'), { type: 'move', from: { row: 2, col: 2 }, to: { row: 4, col: 4 } });
    expect(parse(serialize(moved)).status).toBe('ok');
    const ghost = { rows: 5, cols: 5, cells: [77, ...Array(24).fill(null)] };
    const bad = (patch: Record<string, unknown>) => parse(serialize({ ...moved, ...patch } as RunState)).status;
    expect(bad({ undoStack: [ghost] })).toBe('corrupt');
    expect(bad({ market: moved.market.map((o, i) => (i === 0 ? { ...o, sold: 'yes' } : o)) })).toBe('corrupt');
    expect(bad({ lastNight: { garbage: 1 } })).toBe('corrupt');
    expect(bad({ lossReason: 'boredom' })).toBe('corrupt');
    const played = must(createRun('qa'), { type: 'ring' });
    expect(parse(serialize(played)).status).toBe('ok');
  });

  it('versão de regras diferente ou schema futuro: incompatível, com backup', () => {
    const s = createRun('ver');
    const old = JSON.stringify({ schemaVersion: 1, rulesVersion: 'p0-old', state: { ...s, rulesVersion: 'p0-old' } });
    const st = memStore({ [SAVE_KEY]: old });
    expect(loadRun(st)).toEqual({ status: 'incompatible', rulesVersion: 'p0-old' });
    expect(st.data.get(BACKUP_KEY)).toBe(old);
    expect(parse(JSON.stringify({ schemaVersion: 99, rulesVersion: 'x', state: s })).status).toBe('incompatible');
  });

  it('armazenamento que lança erro não derruba o jogo', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
      removeItem: () => {
        throw new Error('x');
      },
    };
    expect(saveRun(broken, createRun('x'))).toBe(false);
    expect(loadRun(broken)).toEqual({ status: 'empty' });
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/core/config';
import { findCoord, getAt } from '../src/core/grid';
import { RELICS, sellPrice } from '../src/core/relics';
import { applyAction, createRun, previewNight, replay, tributeFor, type Action, type RunState } from '../src/core/run';

function must(s: RunState, a: Action): RunState {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
  return r.value;
}
const ring = (s: RunState) => must(s, { type: 'ring' });

describe('partida: criação', () => {
  it('estado inicial do GDD: 12 óbolos, vela, crânio e pena, 4 ofertas, noite 1', () => {
    const s = createRun('teste');
    expect([s.balance, s.night, s.curse, s.phase, s.market.length, s.rerollCost]).toEqual([12, 1, 0, 'organize', 4, 2]);
    expect(Object.values(s.instances).map((i) => i.relic).sort()).toEqual(['candle', 'feather', 'skull']);
  });

  it('configuração inicial gera moeda: vela adjacente ao crânio paga a noite 1', () => {
    const s = createRun('teste');
    expect(previewNight(s).gain).toBe(10);
    const after = ring(s);
    expect(after.phase).toBe('reward');
    expect(after.balance).toBe(12 + 10 - 10);
  });

  it('mesma seed ⇒ mesmo mercado; seeds diferentes costumam diferir', () => {
    expect(createRun('a').market).toEqual(createRun('a').market);
    const distinct = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((k) => JSON.stringify(createRun(k).market)));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('é serializável em JSON sem perda', () => {
    const s = ring(createRun('json'));
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('partida: transações', () => {
  it('comprar debita o preço, ocupa a célula e marca a oferta como vendida', () => {
    let s = createRun('compra');
    s = { ...s, balance: 100 };
    const offer = s.market[0]!;
    const t = must(s, { type: 'buy', offer: 0, at: { row: 4, col: 4 } });
    expect(t.balance).toBe(100 - RELICS[offer.relic].price);
    expect(t.instances[getAt(t.grid, { row: 4, col: 4 })!]!.relic).toBe(offer.relic);
    expect(t.market[0]!.sold).toBe(true);
    expect(applyAction(t, { type: 'buy', offer: 0 })).toEqual({ ok: false, error: 'offer_sold' });
  });

  it('compra inválida não altera nada', () => {
    const s = { ...createRun('x'), balance: 0 };
    expect(applyAction(s, { type: 'buy', offer: 0 })).toEqual({ ok: false, error: 'insufficient_funds' });
    const rich = { ...s, balance: 100 };
    expect(applyAction(rich, { type: 'buy', offer: 9 })).toEqual({ ok: false, error: 'invalid_offer' });
    expect(applyAction(rich, { type: 'buy', offer: 0, at: { row: 2, col: 1 } })).toEqual({ ok: false, error: 'cell_occupied' });
  });

  it('sem arbitragem: comprar e vender a mesma relíquia nunca dá lucro', () => {
    for (const r of Object.values(RELICS)) expect(sellPrice(r.id)).toBeLessThan(r.price);
    for (const r of Object.values(RELICS)) expect(sellPrice(r.id)).toBeGreaterThanOrEqual(1);
  });

  it('vender remove a instância e credita metade do preço-base', () => {
    const s = createRun('venda');
    const t = must(s, { type: 'sell', at: { row: 2, col: 2 } });
    expect(t.balance).toBe(12 + sellPrice('skull'));
    expect(getAt(t.grid, { row: 2, col: 2 })).toBeNull();
    expect(Object.keys(t.instances).length).toBe(2);
    expect(applyAction(t, { type: 'sell', at: { row: 2, col: 2 } })).toEqual({ ok: false, error: 'cell_empty' });
  });

  it('renovar custa 2, depois 3; volta a 2 na noite seguinte; consome PRNG', () => {
    let s = createRun('reroll');
    s = must(s, { type: 'reroll' });
    expect([s.balance, s.rerollCost]).toEqual([10, 3]);
    s = must(s, { type: 'reroll' });
    expect([s.balance, s.rerollCost]).toEqual([7, 4]);
    s = must(s, { type: 'move', from: { row: 0, col: 4 }, to: { row: 0, col: 3 } });
    s = ring(s); // +10 → 17, paga 10
    expect(s.balance).toBe(7);
    s = must(s, { type: 'skipReward' });
    expect(s.rerollCost).toBe(2);
  });

  it('mover preserva IDs; desfazer só desfaz posicionamentos desde a última transação', () => {
    let s = createRun('undo');
    const skullId = getAt(s.grid, { row: 2, col: 2 })!;
    s = must(s, { type: 'move', from: { row: 2, col: 2 }, to: { row: 4, col: 4 } });
    expect(findCoord(s.grid, skullId)).toEqual({ row: 4, col: 4 });
    s = must(s, { type: 'undo' });
    expect(findCoord(s.grid, skullId)).toEqual({ row: 2, col: 2 });
    s = must(s, { type: 'move', from: { row: 2, col: 2 }, to: { row: 4, col: 4 } });
    s = must(s, { type: 'reroll' });
    expect(applyAction(s, { type: 'undo' })).toEqual({ ok: false, error: 'nothing_to_undo' });
  });

  it('não há ações de organização fora da fase de organização', () => {
    const s = ring(createRun('fase'));
    for (const a of [{ type: 'ring' }, { type: 'reroll' }, { type: 'undo' }, { type: 'buy', offer: 0 }] as Action[])
      expect(applyAction(s, a)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(applyAction(createRun('f'), { type: 'skipReward' })).toEqual({ ok: false, error: 'wrong_phase' });
  });
});

describe('partida: noites, tributo e fim', () => {
  it('pagamento exato é aceito; saldo excedente permanece', () => {
    const s = { ...createRun('exato'), balance: 0 }; // ganho 10 = tributo 10
    const t = ring(s);
    expect([t.phase, t.balance]).toEqual(['reward', 0]);
  });

  it('saldo insuficiente após a resolução ⇒ derrota por tributo', () => {
    const s = must(createRun('pobre'), { type: 'sell', at: { row: 2, col: 2 } });
    const t = ring({ ...s, balance: 0 });
    expect([t.phase, t.lossReason]).toEqual(['lost', 'tribute']);
    expect(t.lastNight?.paid).toBe(false);
  });

  it('maldição 100 tem precedência sobre o pagamento', () => {
    let s = { ...createRun('maldito'), balance: 1000, curse: 97 }; // pena −5 → 92, livro +8 → 100
    // troca o crânio inicial por um livro
    s = { ...s, instances: { ...s.instances, 2: { relic: 'book' } } };
    const t = ring(s);
    expect([t.phase, t.lossReason, t.curse]).toEqual(['lost', 'curse', 100]);
    expect(t.lastNight?.paid).toBe(false);
  });

  it('recompensa: 3 relíquias distintas; escolher coloca na primeira célula livre; recusar sempre funciona', () => {
    const s = ring(createRun('recompensa'));
    expect(s.rewardOptions.length).toBe(3);
    expect(new Set(s.rewardOptions).size).toBe(3);
    const chosen = must(s, { type: 'chooseReward', index: 1 });
    expect(Object.keys(chosen.instances).length).toBe(4);
    expect(chosen.night).toBe(2);
    const skipped = must(s, { type: 'skipReward' });
    expect(Object.keys(skipped.instances).length).toBe(3);
    expect(applyAction(s, { type: 'chooseReward', index: 7 })).toEqual({ ok: false, error: 'invalid_reward' });
  });

  it('bancada cheia: nenhuma relíquia oferecida, recusar segue para a próxima noite', () => {
    let s = createRun('cheia');
    const cells = s.grid.cells.map((c, i) => c ?? 100 + i);
    const instances = { ...s.instances } as Record<number, { relic: 'coin' }>;
    cells.forEach((id) => {
      if (id >= 100) instances[id] = { relic: 'coin' };
    });
    s = { ...s, grid: { ...s.grid, cells }, instances, nextId: 200 };
    const t = ring(s);
    expect(t.phase).toBe('reward');
    expect(t.rewardOptions).toEqual([]);
    expect(must(t, { type: 'skipReward' }).night).toBe(2);
  });

  it('vitória ao pagar a quinta noite, sem recompensa final', () => {
    let s = createRun('vitoria');
    s = { ...s, balance: 10_000 };
    for (let n = 1; n <= 5; n++) {
      expect(s.night).toBe(n);
      s = ring(s);
      if (n < 5) s = must(s, { type: 'skipReward' });
    }
    expect(s.phase).toBe('won');
    expect(s.rewardOptions).toEqual([]);
    expect(s.balance).toBe(10_000 + 50 - DEFAULT_CONFIG.tributes.reduce((a, b) => a + b, 0));
  });

  it('a prévia é exata e não altera estado nem PRNG', () => {
    const s = createRun('previa');
    const frozen = JSON.stringify(s);
    const p = previewNight(s);
    expect(JSON.stringify(s)).toBe(frozen);
    const t = ring(s);
    expect(t.lastNight?.gain).toBe(p.gain);
    expect(t.lastNight?.events).toEqual(p.events);
  });

  it('saldo perto do teto: sino e venda recusados sem mutação', () => {
    const s = { ...createRun('teto'), balance: DEFAULT_CONFIG.maxBalance - 5 };
    expect(applyAction(s, { type: 'ring' })).toEqual({ ok: false, error: 'balance_overflow' });
    const full = { ...s, balance: DEFAULT_CONFIG.maxBalance };
    expect(applyAction(full, { type: 'sell', at: { row: 2, col: 2 } })).toEqual({ ok: false, error: 'balance_overflow' });
  });

  it('noite truncada não é gravada', () => {
    const cfg = { ...DEFAULT_CONFIG, maxEventsPerNight: 1 };
    const s = createRun('trunc', cfg);
    expect(applyAction(s, { type: 'ring' }, cfg)).toEqual({ ok: false, error: 'resolution_truncated' });
  });

  it('tributo por noite segue a configuração', () => {
    expect(tributeFor(createRun('t'))).toBe(10);
  });
});

describe('determinismo', () => {
  it('mesmas ações + mesma seed ⇒ mesmo estado final', () => {
    const actions: Action[] = [
      { type: 'reroll' },
      { type: 'buy', offer: 0 },
      { type: 'move', from: { row: 0, col: 4 }, to: { row: 1, col: 1 } },
      { type: 'ring' },
      { type: 'chooseReward', index: 0 },
      { type: 'buy', offer: 1 },
      { type: 'ring' },
    ];
    const a = replay('determinismo', actions);
    const b = replay('determinismo', actions);
    expect(a).toEqual(b);
  });
});

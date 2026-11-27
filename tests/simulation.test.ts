/**
 * Simulação de fumaça (não é balanceamento): estratégias simples jogam muitas seeds e verificamos
 * invariantes. Distribuição de resultados é impressa só com SIM_REPORT=1.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/core/config';
import { RELICS } from '../src/core/relics';
import { applyAction, createRun, previewNight, type Action, type RunState } from '../src/core/run';
import { createRng, nextInt, type RngState } from '../src/core/rng';

type Strategy = (s: RunState, rng: RngState) => { action: Action; rng: RngState };

const coordOf = (i: number) => ({ row: Math.floor(i / 5), col: i % 5 });

/** Aleatória: ações legais quaisquer, até tocar o sino. */
const randomStrategy: Strategy = (s, rng) => {
  if (s.phase === 'reward') {
    const r = nextInt(rng, s.rewardOptions.length + 1);
    return { action: r.value < s.rewardOptions.length ? { type: 'chooseReward', index: r.value } : { type: 'skipReward' }, rng: r.state };
  }
  const r = nextInt(rng, 6);
  if (r.value === 0) return { action: { type: 'ring' }, rng: r.state };
  if (r.value === 1) {
    const o = nextInt(r.state, s.market.length);
    return { action: { type: 'buy', offer: o.value }, rng: o.state };
  }
  if (r.value === 2) return { action: { type: 'reroll' }, rng: r.state };
  const a = nextInt(r.state, 25);
  const b = nextInt(a.state, 25);
  return { action: { type: 'move', from: coordOf(a.value), to: coordOf(b.value) }, rng: b.state };
};

/** Gananciosa: compra a oferta que mais aumenta a prévia (testando todas as células vazias); senão toca o sino. */
const greedyStrategy: Strategy = (s, rng) => {
  if (s.phase === 'reward') return { action: s.rewardOptions.length ? { type: 'chooseReward', index: 0 } : { type: 'skipReward' }, rng };
  const base = previewNight(s).gain;
  let best: { action: Action; gain: number } | null = null;
  s.market.forEach((o, k) => {
    if (o.sold || RELICS[o.relic].price > s.balance) return;
    s.grid.cells.forEach((c, i) => {
      if (c !== null) return;
      const r = applyAction(s, { type: 'buy', offer: k, at: coordOf(i) });
      if (!r.ok) return;
      const p = previewNight(r.value);
      if (p.outcome !== 'complete') return;
      const gain = p.gain - RELICS[o.relic].price;
      if (gain > (best?.gain ?? base)) best = { action: { type: 'buy', offer: k, at: coordOf(i) }, gain };
    });
  });
  return { action: best ? (best as { action: Action }).action : { type: 'ring' }, rng };
};

function play(seed: string, strategy: Strategy, maxSteps = 400): { state: RunState; steps: number } {
  let s = createRun(seed);
  let rng = createRng(seed.length * 7919 + 1);
  let steps = 0;
  while ((s.phase === 'organize' || s.phase === 'reward') && steps < maxSteps) {
    const d = strategy(s, rng);
    rng = d.rng;
    const r = applyAction(s, d.action);
    steps++;
    if (r.ok) s = r.value;
    else if (d.action.type !== 'ring' && s.phase === 'organize' && steps % 20 === 0) {
      const forced = applyAction(s, { type: 'ring' });
      if (forced.ok) s = forced.value;
    }
    checkInvariants(s);
  }
  return { state: s, steps };
}

function checkInvariants(s: RunState): void {
  const ids = s.grid.cells.filter((c): c is number => c !== null);
  expect(new Set(ids).size).toBe(ids.length); // nenhum item em dois lugares
  for (const id of ids) expect(s.instances[id]).toBeDefined();
  expect(Object.keys(s.instances).length).toBe(ids.length); // nenhuma instância fantasma
  expect(Number.isSafeInteger(s.balance) && s.balance >= 0 && s.balance <= DEFAULT_CONFIG.maxBalance).toBe(true);
  expect(s.curse >= 0 && s.curse <= 100).toBe(true);
  expect(s.night >= 1 && s.night <= 5).toBe(true);
}

describe('simulação de fumaça', () => {
  for (const [name, strat] of [
    ['aleatória', randomStrategy],
    ['gananciosa', greedyStrategy],
  ] as const) {
    it(`estratégia ${name}: 150 seeds terminam sem violar invariantes e de forma reproduzível`, () => {
      const tally: Record<string, number> = {};
      for (let i = 0; i < 150; i++) {
        const { state } = play(`sim-${name}-${i}`, strat);
        const key = state.phase === 'won' ? 'vitória' : state.phase === 'lost' ? `derrota n${state.night} (${state.lossReason})` : 'inacabada';
        tally[key] = (tally[key] ?? 0) + 1;
        if (i < 5) expect(play(`sim-${name}-${i}`, strat).state).toEqual(state);
      }
      if (process.env.SIM_REPORT) console.log(name, tally);
      expect(tally['inacabada'] ?? 0).toBe(0);
    });
  }
});

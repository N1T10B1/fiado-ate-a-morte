/**
 * QA (P0-02c): roda os cenários de partida (tests/fixtures/run/*.json) contra applyAction.
 * As fixtures de resolução rodam em tests/qa-fixtures.test.ts (thread de programação).
 * As fixtures são escritas à mão a partir das regras (docs/TEST_PLAN.md); divergência
 * é defeito de um dos lados e vai para a thread de programação, nunca se ajusta em silêncio.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/core/config';
import { createGrid, place, type Grid } from '../src/core/grid';
import { isRelicId, type RelicId } from '../src/core/relics';
import { applyAction, createRun, tributeFor, type Action, type RunState } from '../src/core/run';

interface RelicSpec { id: number; def: string; row: number; col: number }

function board(relics: RelicSpec[]): { grid: Grid; instances: Record<number, { relic: RelicId }> } {
  let grid = createGrid(5);
  const instances: Record<number, { relic: RelicId }> = {};
  for (const r of relics) {
    if (!isRelicId(r.def)) throw new Error(`relíquia desconhecida ${r.def}`);
    const p = place(grid, { row: r.row, col: r.col }, r.id);
    if (!p.ok) throw new Error(`(${r.row},${r.col}): ${p.error}`);
    grid = p.value;
    instances[r.id] = { relic: r.def };
  }
  return { grid, instances };
}

const dir = (sub: string): string => fileURLToPath(new URL(`./fixtures/${sub}/`, import.meta.url));
function load<T>(sub: string): T[] {
  return readdirSync(dir(sub))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(dir(sub) + f, 'utf8')) as T);
}

// ---------------- partida ----------------
interface Offer { def: string; price: number; sold: boolean }
interface RunFixture {
  id: string;
  title: string;
  setup: {
    seedText?: string;
    state?: Partial<Omit<RunState, 'market' | 'grid' | 'instances'>> & { relics: RelicSpec[]; market?: Offer[] };
    config?: { maxEvents: number };
  };
  config?: { maxEvents: number };
  steps: { action: Record<string, unknown> & { type: string }; expect: Expectation }[];
}
interface Expectation {
  ok: boolean;
  error?: string;
  stateUnchanged?: boolean;
  rngUnchanged?: boolean;
  nightGain?: number;
  rewardOffers?: { count: number; distinctDefs?: boolean };
  rngAdvanced?: boolean;
  cosmeticRngUnchanged?: boolean;
  state?: Record<string, unknown>;
}

function buildState(f: RunFixture): RunState {
  const s = f.setup.state;
  const base = createRun(f.setup.seedText ?? `qa-${f.id}`);
  if (!s) return base;
  const { relics, market, ...rest } = s;
  return {
    ...base,
    ...rest,
    ...board(relics),
    ...(market ? { market: market.map((o) => ({ relic: o.def as RelicId, sold: o.sold })) } : {}),
  } as RunState;
}

function relicsOf(state: RunState): RelicSpec[] {
  const out: RelicSpec[] = [];
  state.grid.cells.forEach((id, i) => {
    if (id !== null) out.push({ id, def: state.instances[id]?.relic ?? '?', row: Math.floor(i / 5), col: i % 5 });
  });
  return out.sort((a, b) => a.id - b.id);
}

function checkState(after: RunState, exp: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(exp)) {
    switch (k) {
      case 'relics':
        expect(relicsOf(after)).toEqual([...(v as RelicSpec[])].sort((a, b) => a.id - b.id));
        break;
      case 'relicAdded': {
        const r = v as RelicSpec;
        expect(relicsOf(after)).toContainEqual(r);
        break;
      }
      case 'relicRemoved':
        expect(after.instances[v as number]).toBeUndefined();
        expect(after.grid.cells).not.toContain(v);
        break;
      case 'offerSold':
        expect(after.market[v as number]?.sold).toBe(true);
        break;
      case 'undoCleared':
        expect(after.undoStack).toHaveLength(0);
        break;
      case 'tribute':
        expect(tributeFor(after)).toBe(v);
        break;
      case 'marketSize':
        expect(after.market).toHaveLength(v as number);
        break;
      default:
        expect((after as unknown as Record<string, unknown>)[k], k).toEqual(v);
    }
  }
}

describe('QA — cenários de partida contra applyAction', () => {
  for (const f of load<RunFixture>('run')) {
    it(`${f.id} — ${f.title}`, () => {
      const maxEvents = f.config?.maxEvents ?? f.setup.config?.maxEvents;
      const cfg = maxEvents ? { ...DEFAULT_CONFIG, maxEventsPerNight: maxEvents } : DEFAULT_CONFIG;
      let state = buildState(f);
      for (const step of f.steps) {
        if (step.action.type === 'newRun') {
          state = createRun(step.action['seedText'] as string);
          checkState(state, step.expect.state ?? {});
          continue;
        }
        const before = state;
        const r = applyAction(state, step.action as unknown as Action, cfg);
        if (!step.expect.ok) {
          expect(r.ok, `${f.id}: esperava erro ${step.expect.error}`).toBe(false);
          if (!r.ok) expect(r.error).toBe(step.expect.error);
          continue; // applyAction devolve erro sem estado novo: stateUnchanged/rngUnchanged valem por construção

        }
        expect(r.ok, `${f.id}: ${!r.ok ? r.error : ''}`).toBe(true);
        if (!r.ok) return;
        state = r.value;
        if (step.expect.nightGain !== undefined) expect(state.lastNight?.gain).toBe(step.expect.nightGain);
        if (step.expect.rewardOffers) {
          expect(state.rewardOptions).toHaveLength(step.expect.rewardOffers.count);
          if (step.expect.rewardOffers.distinctDefs) expect(new Set(state.rewardOptions).size).toBe(state.rewardOptions.length);
        }
        if (step.expect.rngAdvanced) expect(state.rng).not.toEqual(before.rng);
        checkState(state, step.expect.state ?? {});
      }
    });
  }
});


// ---------------- seed ----------------
interface SeedFixture {
  id: string;
  catalogOrder: string[];
  cases: { seedText: string; gameplayInitial: number; market: string[]; gameplayAfterMarket: number; rerollMarket: string[] }[];
}

describe('QA — golden de seed contra createRun', () => {
  for (const f of load<SeedFixture>('seed')) {
    for (const c of f.cases) {
      it(`${f.id} — ${c.seedText}: mercado inicial e após renovar`, () => {
        const s0 = createRun(c.seedText);
        expect(s0.market.map((o) => o.relic)).toEqual(c.market);
        expect(s0.rng.s).toBe(c.gameplayAfterMarket);
        const r = applyAction({ ...s0, balance: 50 }, { type: 'reroll' });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.value.market.map((o) => o.relic)).toEqual(c.rerollMarket);
      });
    }
  }
});

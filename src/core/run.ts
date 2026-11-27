/**
 * Partida de P1 (P1-004): estado serializável e ações puras.
 * `applyAction` nunca muta o estado recebido; ação inválida devolve erro e nada muda
 * (nem o PRNG). Compra, venda e renovação são transações explícitas e limpam o desfazer.
 */
import { DEFAULT_CONFIG, RULES_VERSION, type RunConfig } from './config';
import type { GameEvent, NightOutcome } from './events';
import { createGrid, findCoord, getAt, inBounds, place, remove, swap, type Coord, type Grid, type InstanceId } from './grid';
import { resolveNight, type NightResult, type RelicInstance } from './resolve';
import { RELIC_IDS, RELICS, sellPrice, type RelicId } from './relics';
import { err, ok, type Result } from './result';
import { createStreams, hashSeedText, nextInt, type RngState } from './rng';

export type Phase = 'organize' | 'reward' | 'won' | 'lost';
export type LossReason = 'curse' | 'tribute';

export interface MarketOffer {
  readonly relic: RelicId;
  readonly sold: boolean;
}

export interface NightSummary {
  readonly night: number;
  readonly events: readonly GameEvent[];
  readonly gain: number;
  readonly tribute: number;
  readonly paid: boolean;
  readonly outcome: NightOutcome;
  readonly destroyedIds: readonly InstanceId[];
  /** Instâncias presentes antes da resolução (para a UI nomear destruídos). */
  readonly instancesBefore: Readonly<Record<InstanceId, RelicInstance>>;
}

export interface RunState {
  readonly rulesVersion: string;
  readonly seedText: string;
  readonly rng: RngState;
  readonly night: number;
  readonly balance: number;
  readonly curse: number;
  readonly destroyedThisRun: number;
  readonly nextId: InstanceId;
  readonly grid: Grid;
  readonly instances: Readonly<Record<InstanceId, RelicInstance>>;
  readonly market: readonly MarketOffer[];
  readonly rerollCost: number;
  readonly rewardOptions: readonly RelicId[];
  readonly phase: Phase;
  readonly lossReason: LossReason | null;
  readonly undoStack: readonly Grid[];
  readonly lastNight: NightSummary | null;
}

export type Action =
  | { readonly type: 'move'; readonly from: Coord; readonly to: Coord }
  | { readonly type: 'buy'; readonly offer: number; readonly at?: Coord }
  | { readonly type: 'sell'; readonly at: Coord }
  | { readonly type: 'reroll' }
  | { readonly type: 'undo' }
  | { readonly type: 'ring' }
  | { readonly type: 'chooseReward'; readonly index: number }
  | { readonly type: 'skipReward' };

export type ActionError =
  | 'wrong_phase'
  | 'invalid_move'
  | 'invalid_offer'
  | 'offer_sold'
  | 'insufficient_funds'
  | 'no_space'
  | 'cell_occupied'
  | 'cell_empty'
  | 'out_of_bounds'
  | 'nothing_to_undo'
  | 'invalid_reward'
  | 'balance_overflow'
  | 'resolution_truncated';

// ---------- PRNG de gameplay ----------
function drawRelic(rng: RngState, cfg: RunConfig, exclude: readonly RelicId[] = []): { relic: RelicId; rng: RngState } {
  const pool = RELIC_IDS.filter((r) => !exclude.includes(r));
  const total = pool.reduce((s, r) => s + cfg.rarityWeights[RELICS[r].rarity], 0);
  const roll = nextInt(rng, total);
  let acc = 0;
  for (const r of pool) {
    acc += cfg.rarityWeights[RELICS[r].rarity];
    if (roll.value < acc) return { relic: r, rng: roll.state };
  }
  return { relic: pool[pool.length - 1] as RelicId, rng: roll.state };
}

function rollMarket(rng: RngState, cfg: RunConfig): { market: MarketOffer[]; rng: RngState } {
  const market: MarketOffer[] = [];
  let cur = rng;
  for (let i = 0; i < cfg.marketOffers; i++) {
    const d = drawRelic(cur, cfg);
    cur = d.rng;
    market.push({ relic: d.relic, sold: false });
  }
  return { market, rng: cur };
}

function firstEmpty(grid: Grid): Coord | null {
  const i = grid.cells.indexOf(null);
  return i === -1 ? null : { row: Math.floor(i / grid.cols), col: i % grid.cols };
}

// ---------- criação ----------
export function createRun(seedText: string, cfg: RunConfig = DEFAULT_CONFIG): RunState {
  let grid = createGrid(cfg.gridSize);
  const instances: Record<InstanceId, RelicInstance> = {};
  let nextId = 1;
  for (const s of cfg.startRelics) {
    const r = place(grid, { row: s.row, col: s.col }, nextId);
    if (!r.ok) throw new Error(`Configuração inicial inválida: ${r.error}`);
    grid = r.value;
    instances[nextId] = { relic: s.relic };
    nextId++;
  }
  const m = rollMarket(createStreams(hashSeedText(seedText)).gameplay, cfg);
  return {
    rulesVersion: RULES_VERSION,
    seedText,
    rng: m.rng,
    night: 1,
    balance: cfg.startBalance,
    curse: 0,
    destroyedThisRun: 0,
    nextId,
    grid,
    instances,
    market: m.market,
    rerollCost: cfg.rerollBaseCost,
    rewardOptions: [],
    phase: 'organize',
    lossReason: null,
    undoStack: [],
    lastNight: null,
  };
}

export function tributeFor(state: RunState, cfg: RunConfig = DEFAULT_CONFIG): number {
  return cfg.tributes[state.night - 1] ?? 0;
}

/** Prévia exata da noite: não altera estado, não consome seed. */
export function previewNight(state: RunState, cfg: RunConfig = DEFAULT_CONFIG): NightResult {
  return resolveNight({
    grid: state.grid,
    instances: state.instances,
    curse: state.curse,
    destroyedThisRun: state.destroyedThisRun,
    night: state.night,
    maxEvents: cfg.maxEventsPerNight,
    maxBalance: cfg.maxBalance,
    balance: state.balance,
  });
}

// ---------- ações ----------
export function applyAction(
  state: RunState,
  action: Action,
  cfg: RunConfig = DEFAULT_CONFIG,
): Result<RunState, ActionError> {
  const organizing = state.phase === 'organize';
  switch (action.type) {
    case 'move': {
      if (!organizing) return err('wrong_phase');
      const r = swap(state.grid, action.from, action.to);
      if (!r.ok) return err(r.error === 'out_of_bounds' ? 'out_of_bounds' : 'invalid_move');
      return ok({ ...state, grid: r.value, undoStack: [...state.undoStack, state.grid] });
    }
    case 'undo': {
      if (!organizing) return err('wrong_phase');
      const prev = state.undoStack[state.undoStack.length - 1];
      if (!prev) return err('nothing_to_undo');
      return ok({ ...state, grid: prev, undoStack: state.undoStack.slice(0, -1) });
    }
    case 'buy': {
      if (!organizing) return err('wrong_phase');
      const offer = state.market[action.offer];
      if (!offer) return err('invalid_offer');
      if (offer.sold) return err('offer_sold');
      const price = RELICS[offer.relic].price;
      if (state.balance < price) return err('insufficient_funds');
      let at: Coord | null;
      if (action.at) {
        if (!inBounds(state.grid, action.at)) return err('out_of_bounds');
        if (getAt(state.grid, action.at) !== null) return err('cell_occupied');
        at = action.at;
      } else at = firstEmpty(state.grid);
      if (!at) return err('no_space');
      const placed = place(state.grid, at, state.nextId);
      if (!placed.ok) return err('no_space');
      return ok({
        ...state,
        balance: state.balance - price,
        grid: placed.value,
        instances: { ...state.instances, [state.nextId]: { relic: offer.relic } },
        nextId: state.nextId + 1,
        market: state.market.map((o, i) => (i === action.offer ? { ...o, sold: true } : o)),
        undoStack: [],
      });
    }
    case 'sell': {
      if (!organizing) return err('wrong_phase');
      const r = remove(state.grid, action.at);
      if (!r.ok) return err(r.error === 'out_of_bounds' ? 'out_of_bounds' : 'cell_empty');
      const inst = state.instances[r.value.id] as RelicInstance;
      const instances = { ...state.instances };
      delete instances[r.value.id];
      const credited = state.balance + sellPrice(inst.relic);
      if (credited > cfg.maxBalance) return err('balance_overflow');
      return ok({
        ...state,
        balance: credited,
        grid: r.value.grid,
        instances,
        undoStack: [],
      });
    }
    case 'reroll': {
      if (!organizing) return err('wrong_phase');
      if (state.balance < state.rerollCost) return err('insufficient_funds');
      const m = rollMarket(state.rng, cfg);
      return ok({
        ...state,
        balance: state.balance - state.rerollCost,
        rerollCost: state.rerollCost + cfg.rerollCostStep,
        market: m.market,
        rng: m.rng,
        undoStack: [],
      });
    }
    case 'ring': {
      if (!organizing) return err('wrong_phase');
      // Noite truncada ou com overflow é defeito: nada é gravado, o estado fica como antes do sino.
      const res = previewNight(state, cfg);
      if (res.outcome === 'truncated') return err('resolution_truncated');
      if (res.outcome === 'balance_overflow') return err('balance_overflow');
      return ok(settleNight(state, cfg));
    }
    case 'chooseReward':
    case 'skipReward': {
      if (state.phase !== 'reward') return err('wrong_phase');
      let grid = state.grid;
      let instances = state.instances;
      let nextId = state.nextId;
      if (action.type === 'chooseReward') {
        const relic = state.rewardOptions[action.index];
        if (!relic) return err('invalid_reward');
        const at = firstEmpty(grid);
        if (!at) return err('no_space');
        const placed = place(grid, at, nextId);
        if (!placed.ok) return err('no_space');
        grid = placed.value;
        instances = { ...instances, [nextId]: { relic } };
        nextId++;
      }
      const m = rollMarket(state.rng, cfg);
      return ok({
        ...state,
        grid,
        instances,
        nextId,
        night: state.night + 1,
        market: m.market,
        rng: m.rng,
        rerollCost: cfg.rerollBaseCost,
        rewardOptions: [],
        phase: 'organize',
        undoStack: [],
      });
    }
  }
}

function settleNight(state: RunState, cfg: RunConfig): RunState {
  const res = previewNight(state, cfg);
  const tribute = tributeFor(state, cfg);
  const instances = { ...state.instances };
  for (const id of res.destroyedIds) delete instances[id];
  const balanceAfterGain = state.balance + res.gain; // teto já verificado no resolvedor
  const base = {
    ...state,
    grid: res.grid,
    instances,
    curse: res.curse,
    destroyedThisRun: res.destroyedThisRun,
    undoStack: [],
  };
  const summary = (paid: boolean): NightSummary => ({
    night: state.night,
    events: res.events,
    gain: res.gain,
    tribute,
    paid,
    outcome: res.outcome,
    destroyedIds: res.destroyedIds,
    instancesBefore: state.instances,
  });

  // Maldição em 100 tem precedência sobre o pagamento.
  if (res.outcome === 'curse_defeat') {
    return { ...base, balance: balanceAfterGain, phase: 'lost', lossReason: 'curse', lastNight: summary(false) };
  }
  if (balanceAfterGain < tribute) {
    return { ...base, balance: balanceAfterGain, phase: 'lost', lossReason: 'tribute', lastNight: summary(false) };
  }
  const balance = balanceAfterGain - tribute;
  if (state.night >= cfg.tributes.length) {
    return { ...base, balance, phase: 'won', lastNight: summary(true) };
  }
  // Recompensa: relíquias distintas, só se houver espaço (D006); recusar sempre é possível.
  let rng = state.rng;
  const rewardOptions: RelicId[] = [];
  if (firstEmpty(res.grid)) {
    for (let i = 0; i < cfg.rewardChoices; i++) {
      const d = drawRelic(rng, cfg, rewardOptions);
      rng = d.rng;
      rewardOptions.push(d.relic);
    }
  }
  return { ...base, balance, rng, rewardOptions, phase: 'reward', lastNight: summary(true) };
}

/** Replay determinístico: mesma seed + mesmas ações + mesma versão ⇒ mesmo estado. */
export function replay(
  seedText: string,
  actions: readonly Action[],
  cfg: RunConfig = DEFAULT_CONFIG,
): { state: RunState; rejected: number[] } {
  let state = createRun(seedText, cfg);
  const rejected: number[] = [];
  actions.forEach((a, i) => {
    const r = applyAction(state, a, cfg);
    if (r.ok) state = r.value;
    else rejected.push(i);
  });
  return { state, rejected };
}

export function coordOfInstance(state: RunState, id: InstanceId): Coord | null {
  return findCoord(state.grid, id);
}

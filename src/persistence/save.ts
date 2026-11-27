/**
 * Save versionado da partida (P1-006). Cada ação do motor é atômica e o resultado da noite
 * já está no estado quando a animação começa, então gravar após cada ação aceita é gravar em
 * fronteira estável: recarregar no meio da animação restaura o pós-noite, sem pagar de novo.
 * Save inválido nunca é apagado: vai para uma chave de backup e o jogador recomeça.
 */
import { DEFAULT_CONFIG, RULES_VERSION } from '../core/config';
import { isRelicId } from '../core/relics';
import { isValidRngState } from '../core/rng';
import type { RunState } from '../core/run';

export const SAVE_KEY = 'grave-credit.run';
export const BACKUP_KEY = 'grave-credit.run.corrupt';
export const SCHEMA_VERSION = 1;

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface Envelope {
  schemaVersion: number;
  rulesVersion: string;
  state: RunState;
}

export type LoadResult =
  | { readonly status: 'empty' }
  | { readonly status: 'ok'; readonly state: RunState }
  | { readonly status: 'incompatible'; readonly rulesVersion: string }
  | { readonly status: 'corrupt'; readonly reason: string };

/** Migrações de schema: índice n converte do schema n para n+1. Vazio enquanto só existe a v1. */
const MIGRATIONS: ((raw: Record<string, unknown>) => Record<string, unknown>)[] = [];

export function serialize(state: RunState): string {
  const env: Envelope = { schemaVersion: SCHEMA_VERSION, rulesVersion: state.rulesVersion, state };
  return JSON.stringify(env);
}

export function saveRun(store: KeyValueStore, state: RunState): boolean {
  try {
    store.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false; // armazenamento cheio ou bloqueado: o jogo segue sem save
  }
}

export function clearRun(store: KeyValueStore): void {
  try {
    store.removeItem(SAVE_KEY);
  } catch {
    /* ignorado */
  }
}

export function loadRun(store: KeyValueStore): LoadResult {
  let raw: string | null;
  try {
    raw = store.getItem(SAVE_KEY);
  } catch {
    return { status: 'empty' };
  }
  if (raw === null) return { status: 'empty' };
  const result = parse(raw);
  if (result.status === 'corrupt' || result.status === 'incompatible') {
    try {
      store.setItem(BACKUP_KEY, raw);
      store.removeItem(SAVE_KEY);
    } catch {
      /* se nem o backup grava, o save original fica onde está */
    }
  }
  return result;
}

export function parse(raw: string): LoadResult {
  let env: Record<string, unknown>;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return { status: 'corrupt', reason: 'not_object' };
    env = v as Record<string, unknown>;
  } catch {
    return { status: 'corrupt', reason: 'invalid_json' };
  }
  let version = env['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { status: 'corrupt', reason: 'schema_version' };
  if (version > SCHEMA_VERSION) return { status: 'incompatible', rulesVersion: String(env['rulesVersion']) };
  while (version < SCHEMA_VERSION) {
    const m = MIGRATIONS[version - 1];
    if (!m) return { status: 'corrupt', reason: 'no_migration' };
    env = m(env);
    version++;
  }
  if (env['rulesVersion'] !== RULES_VERSION) return { status: 'incompatible', rulesVersion: String(env['rulesVersion']) };
  const problem = validateState(env['state']);
  if (problem) return { status: 'corrupt', reason: problem };
  return { status: 'ok', state: env['state'] as RunState };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;

/** Valida invariantes do estado; devolve o problema ou null. */
export function validateState(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return 'state';
  const s = v as Record<string, unknown>;
  const cfg = DEFAULT_CONFIG;
  if (s['rulesVersion'] !== RULES_VERSION) return 'rules_version';
  if (typeof s['seedText'] !== 'string') return 'seed';
  if (!isValidRngState(s['rng'])) return 'rng';
  if (!isInt(s['night'], 1, cfg.tributes.length)) return 'night';
  if (!isInt(s['balance'], 0, cfg.maxBalance)) return 'balance';
  if (!isInt(s['curse'], 0, cfg.curseMax)) return 'curse';
  if (!isInt(s['destroyedThisRun'], 0, 10_000)) return 'destroyed';
  if (!isInt(s['rerollCost'], 0, cfg.maxBalance)) return 'reroll';
  if (!['organize', 'reward', 'won', 'lost'].includes(s['phase'] as string)) return 'phase';
  const inst = s['instances'] as Record<string, unknown> | null;
  if (typeof inst !== 'object' || inst === null || Array.isArray(inst)) return 'instances';
  for (const [k, i] of Object.entries(inst)) {
    if (!isInt(Number(k), 0, Number.MAX_SAFE_INTEGER)) return 'instance_id';
    if (typeof i !== 'object' || i === null || !isRelicId((i as Record<string, unknown>)['relic'])) return 'instance_relic';
  }
  const ids = gridIds(s['grid']);
  if (!ids) return 'grid';
  if (ids.some((id) => !(String(id) in inst))) return 'instance_missing';
  if (Object.keys(inst).length !== ids.length) return 'orphan_instance';
  if (!isInt(s['nextId'], 1, Number.MAX_SAFE_INTEGER) || ids.some((id) => id >= (s['nextId'] as number))) return 'next_id';
  // Cada grade do desfazer contém exatamente as mesmas instâncias da grade atual (só movimentos).
  const undo = s['undoStack'];
  if (!Array.isArray(undo)) return 'undo';
  const sorted = [...ids].sort((a, b) => a - b).join(',');
  for (const g of undo) {
    const u = gridIds(g);
    if (!u || [...u].sort((a, b) => a - b).join(',') !== sorted) return 'undo';
  }
  const market = s['market'];
  if (
    !Array.isArray(market) ||
    market.length > cfg.marketOffers ||
    market.some((o) => typeof o !== 'object' || o === null || !isRelicId((o as Record<string, unknown>)['relic']) || typeof (o as Record<string, unknown>)['sold'] !== 'boolean')
  )
    return 'market';
  const reward = s['rewardOptions'];
  if (!Array.isArray(reward) || reward.some((r) => !isRelicId(r))) return 'reward';
  if (s['lossReason'] !== null && s['lossReason'] !== 'curse' && s['lossReason'] !== 'tribute') return 'loss_reason';
  if (!validLastNight(s['lastNight'])) return 'last_night';
  return null;
}

/** IDs de uma grade 5×5 válida (sem duplicatas), ou null. */
function gridIds(v: unknown): number[] | null {
  if (typeof v !== 'object' || v === null) return null;
  const g = v as Record<string, unknown>;
  const n = DEFAULT_CONFIG.gridSize;
  if (g['rows'] !== n || g['cols'] !== n || !Array.isArray(g['cells']) || g['cells'].length !== n * n) return null;
  const ids: number[] = [];
  for (const c of g['cells'] as unknown[]) {
    if (c === null) continue;
    if (!isInt(c, 0, Number.MAX_SAFE_INTEGER) || ids.includes(c)) return null;
    ids.push(c);
  }
  return ids;
}

/** O resumo da noite só alimenta a UI, mas precisa ter a forma que ela lê. */
function validLastNight(v: unknown): boolean {
  if (v === null) return true;
  if (typeof v !== 'object') return false;
  const n = v as Record<string, unknown>;
  return (
    isInt(n['night'], 1, DEFAULT_CONFIG.tributes.length) &&
    Array.isArray(n['events']) &&
    (n['events'] as unknown[]).every((e) => typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>)['type'] === 'string') &&
    isInt(n['gain'], 0, DEFAULT_CONFIG.maxBalance) &&
    isInt(n['tribute'], 0, DEFAULT_CONFIG.maxBalance) &&
    typeof n['paid'] === 'boolean' &&
    typeof n['outcome'] === 'string' &&
    Array.isArray(n['destroyedIds']) &&
    typeof n['instancesBefore'] === 'object' &&
    n['instancesBefore'] !== null
  );
}

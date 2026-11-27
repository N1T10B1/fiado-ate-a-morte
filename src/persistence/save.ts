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
  const grid = s['grid'] as Record<string, unknown> | null;
  if (!grid || grid['rows'] !== cfg.gridSize || grid['cols'] !== cfg.gridSize || !Array.isArray(grid['cells'])) return 'grid';
  const cells = grid['cells'] as unknown[];
  if (cells.length !== cfg.gridSize * cfg.gridSize) return 'grid';
  const inst = s['instances'] as Record<string, unknown> | null;
  if (typeof inst !== 'object' || inst === null) return 'instances';
  const seen = new Set<number>();
  for (const c of cells) {
    if (c === null) continue;
    if (!isInt(c, 0, Number.MAX_SAFE_INTEGER) || seen.has(c)) return 'grid_ids';
    seen.add(c);
    const i = inst[String(c)] as Record<string, unknown> | undefined;
    if (!i || !isRelicId(i['relic'])) return 'instance_relic';
  }
  if (Object.keys(inst).length !== seen.size) return 'orphan_instance';
  if (!isInt(s['nextId'], 1, Number.MAX_SAFE_INTEGER) || [...seen].some((id) => id >= (s['nextId'] as number))) return 'next_id';
  const market = s['market'];
  if (!Array.isArray(market) || market.some((o) => !o || !isRelicId((o as Record<string, unknown>)['relic']))) return 'market';
  const reward = s['rewardOptions'];
  if (!Array.isArray(reward) || reward.some((r) => !isRelicId(r))) return 'reward';
  if (!Array.isArray(s['undoStack'])) return 'undo';
  return null;
}

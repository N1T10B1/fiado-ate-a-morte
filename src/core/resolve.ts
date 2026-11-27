/**
 * Resolvedor determinístico de uma noite (P1-002/P1-003). Puro: não muta a entrada,
 * não usa PRNG (a resolução não tem aleatoriedade), então a prévia é exata.
 *
 * Semântica (hipóteses D001–D004, registradas em DECISIONS):
 * - Relíquias com gatilho `start` entram na fila em ordem de leitura. Relíquias `wake`
 *   só ativam quando despertadas. Cada instância ativa no máximo uma vez por noite;
 *   ao ser enfileirada fica reservada, então não entra duas vezes na fila.
 * - Efeitos derivados vão para o fim da fila; vizinhos na ordem N, E, S, O.
 * - Ganho direto: base (+ bônus abissal congelado na abertura, arredondado para baixo),
 *   depois ×2 se houver um Olho preparado (FIFO; um token por ganho). Cópia e repetição
 *   não são ganhos diretos: não recebem bônus nem consomem o Olho.
 * - Maldição limitada a [0, 100]; atingir 100 encerra a noite com derrota imediata.
 * - Objetos destruídos saem da grade e não ativam depois.
 */
import { DEFAULT_CONFIG, curseBand } from './config';
import type { GameEvent, EventInput, NightOutcome, NoEffectReason } from './events';
import { getAt, inBounds, leftOf, neighbors, occupiedInReadingOrder, type Grid, type InstanceId } from './grid';
import { ABYSS_GAIN_RELICS, EFFECT, RELICS, type RelicId } from './relics';

export interface RelicInstance {
  readonly relic: RelicId;
}

export type Instances = Readonly<Record<InstanceId, RelicInstance>>;

export interface NightInput {
  readonly grid: Grid;
  readonly instances: Instances;
  readonly curse: number;
  readonly destroyedThisRun: number;
  readonly night: number;
  readonly maxEvents?: number;
  readonly maxBalance?: number;
  /** Saldo antes da noite; o teto vale para saldo + ganho. */
  readonly balance?: number;
}

export interface NightResult {
  readonly events: readonly GameEvent[];
  readonly gain: number;
  readonly curse: number;
  readonly destroyedIds: readonly InstanceId[];
  readonly destroyedThisRun: number;
  readonly outcome: NightOutcome;
  /** Grade após remover destruídos. */
  readonly grid: Grid;
}

interface Status {
  alive: boolean;
  activated: boolean;
  reserved: boolean;
}

export function resolveNight(input: NightInput): NightResult {
  const maxEvents = input.maxEvents ?? DEFAULT_CONFIG.maxEventsPerNight;
  const maxBalance = (input.maxBalance ?? DEFAULT_CONFIG.maxBalance) - (input.balance ?? 0);
  const cells = input.grid.cells.slice();
  const grid = (): Grid => ({ rows: input.grid.rows, cols: input.grid.cols, cells });
  const relicOf = (id: InstanceId): RelicId => {
    const inst = input.instances[id];
    if (!inst) throw new Error(`Instância ${id} na grade sem definição`);
    return inst.relic;
  };

  const status = new Map<InstanceId, Status>();
  for (const id of cells) if (id !== null) status.set(id, { alive: true, activated: false, reserved: false });
  const st = (id: InstanceId): Status => status.get(id) as Status;

  const band = curseBand(input.curse); // congelada na abertura (D005)
  const events: GameEvent[] = [];
  const emit = (e: EventInput): void => {
    events.push({ ...e, seq: events.length } as GameEvent);
  };

  let curse = input.curse;
  let gain = 0;
  let destroyedThisRun = input.destroyedThisRun;
  let lastDirectGain = 0;
  const eyeTokens: InstanceId[] = [];
  const destroyedIds: InstanceId[] = [];
  const queue: { id: InstanceId; by: InstanceId | null }[] = [];
  let head = 0;
  let outcome: NightOutcome = 'complete';

  const canWake = (id: InstanceId | null): id is InstanceId => {
    if (id === null) return false;
    const s = st(id);
    return s.alive && !s.activated && !s.reserved && RELICS[relicOf(id)].trigger === 'wake';
  };
  const enqueue = (id: InstanceId, by: InstanceId | null): void => {
    st(id).reserved = true;
    queue.push({ id, by });
  };
  // Overflow nunca é truncado em silêncio (ARCHITECTURE): a noite para com outcome explícito.
  let overflow = false;
  const credit = (amount: number): void => {
    if (gain + amount > maxBalance) overflow = true;
    else gain += amount;
  };
  const directGain = (sourceId: InstanceId, base: number): void => {
    const abyssBonus = ABYSS_GAIN_RELICS.includes(relicOf(sourceId))
      ? Math.floor((base * band.bonusPct) / 100)
      : 0;
    let amount = base + abyssBonus;
    let doubledBy: InstanceId | null = null;
    const token = eyeTokens[0];
    if (token !== undefined && token !== sourceId) {
      eyeTokens.shift();
      doubledBy = token;
      amount *= 2;
    }
    credit(amount);
    lastDirectGain = amount;
    emit({ type: 'GAIN_CURRENCY', sourceId, amount, base, abyssBonus, doubledBy });
  };
  const changeCurse = (sourceId: InstanceId, delta: number): void => {
    const before = curse;
    curse = Math.max(0, Math.min(DEFAULT_CONFIG.curseMax, curse + delta));
    emit({ type: 'CHANGE_CURSE', sourceId, delta: curse - before, curse });
  };
  const noEffect = (sourceId: InstanceId, reason: NoEffectReason): void => {
    emit({ type: 'NO_EFFECT', sourceId, reason });
  };
  const neighborIds = (id: InstanceId): (InstanceId | null)[] => {
    const at = cells.indexOf(id);
    const coord = { row: Math.floor(at / input.grid.cols), col: at % input.grid.cols };
    return neighbors(grid(), coord).map((n) => getAt(grid(), n.coord));
  };

  emit({ type: 'START_NIGHT', night: input.night });
  for (const { id } of occupiedInReadingOrder(input.grid)) {
    if (RELICS[relicOf(id)].trigger === 'start') enqueue(id, null);
  }

  let processed = 0;
  while (head < queue.length) {
    if (processed >= maxEvents) {
      outcome = 'truncated';
      break;
    }
    const item = queue[head++] as { id: InstanceId; by: InstanceId | null };
    const s = st(item.id);
    if (!s.alive || s.activated) continue;
    processed++;
    s.activated = true;
    emit({ type: 'ACTIVATE', sourceId: item.id, byId: item.by });
    const id = item.id;

    switch (relicOf(id)) {
      case 'candle':
        for (const n of neighborIds(id)) if (canWake(n)) enqueue(n, id);
        break;
      case 'skull':
        directGain(id, EFFECT.skullGain);
        break;
      case 'coin':
        directGain(id, EFFECT.coinGain);
        break;
      case 'feather':
        changeCurse(id, EFFECT.featherCurse);
        break;
      case 'book':
        directGain(id, EFFECT.bookGain);
        changeCurse(id, EFFECT.bookCurse);
        break;
      case 'tooth':
        directGain(id, EFFECT.toothBase + EFFECT.toothPerDestroyed * destroyedThisRun);
        break;
      case 'eye':
        eyeTokens.push(id);
        emit({ type: 'ARM_MULTIPLIER', sourceId: id });
        break;
      case 'mirror': {
        const at = cells.indexOf(id);
        const left = leftOf(grid(), { row: Math.floor(at / input.grid.cols), col: at % input.grid.cols });
        const targetId = left && inBounds(grid(), left) ? getAt(grid(), left) : null;
        const base = targetId !== null && st(targetId).alive ? RELICS[relicOf(targetId)].baseGain : undefined;
        if (targetId !== null && base !== undefined) {
          credit(base);
          emit({ type: 'COPY_EFFECT', sourceId: id, targetId, amount: base });
        } else noEffect(id, 'no_copy_source');
        break;
      }
      case 'hourglass':
        if (lastDirectGain > 0) {
          credit(lastDirectGain);
          emit({ type: 'REPEAT_GAIN', sourceId: id, amount: lastDirectGain });
        } else noEffect(id, 'no_prior_gain');
        break;
      case 'bell': {
        let n = 0;
        for (const o of occupiedInReadingOrder(grid())) {
          if (relicOf(o.id) === 'skull' && canWake(o.id)) {
            enqueue(o.id, id);
            n++;
          }
        }
        if (n === 0) noEffect(id, 'no_skull');
        break;
      }
      case 'thread': {
        const target = neighborIds(id).find(canWake);
        if (target !== undefined) enqueue(target, id);
        else noEffect(id, 'no_wake_target');
        changeCurse(id, EFFECT.threadCurse);
        break;
      }
      case 'ring': {
        const target = neighborIds(id).find((n): n is InstanceId => n !== null && st(n).alive);
        if (target !== undefined) {
          st(target).alive = false;
          cells[cells.indexOf(target)] = null;
          destroyedIds.push(target);
          destroyedThisRun++;
          emit({ type: 'DESTROY', sourceId: id, targetId: target });
          directGain(id, EFFECT.ringGain);
        } else noEffect(id, 'no_sacrifice');
        break;
      }
    }

    if (overflow) {
      outcome = 'balance_overflow';
      break;
    }
    if (curse >= DEFAULT_CONFIG.curseMax) {
      outcome = 'curse_defeat';
      break;
    }
  }

  emit({ type: 'END_NIGHT', night: input.night, outcome });
  return { events, gain, curse, destroyedIds, destroyedThisRun, outcome, grid: grid() };
}

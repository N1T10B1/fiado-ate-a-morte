/** Configuração de balanceamento do protótipo P1. Hipóteses (GDD/D006), revisar com simulação. */
import type { Rarity, RelicId } from './relics';

export const RULES_VERSION = 'p1-0.1';

export interface RunConfig {
  readonly gridSize: number;
  readonly startBalance: number;
  readonly startRelics: readonly { readonly relic: RelicId; readonly row: number; readonly col: number }[];
  readonly tributes: readonly number[];
  readonly marketOffers: number;
  readonly rerollBaseCost: number;
  readonly rerollCostStep: number;
  readonly rarityWeights: Readonly<Record<Rarity, number>>;
  readonly rewardChoices: number;
  readonly maxEventsPerNight: number;
  readonly maxBalance: number;
  readonly curseMax: number;
}

export const DEFAULT_CONFIG: RunConfig = {
  gridSize: 5,
  startBalance: 12,
  // Posições didáticas: vela ao lado do crânio (tutorial), pena afastada.
  startRelics: [
    { relic: 'candle', row: 2, col: 1 },
    { relic: 'skull', row: 2, col: 2 },
    { relic: 'feather', row: 0, col: 4 },
  ],
  tributes: [10, 22, 40, 65, 100],
  marketOffers: 4,
  rerollBaseCost: 2,
  rerollCostStep: 1,
  rarityWeights: { common: 60, uncommon: 30, rare: 10 },
  rewardChoices: 3,
  maxEventsPerNight: 256,
  maxBalance: 1_000_000_000,
  curseMax: 100,
};

export interface CurseBand {
  readonly id: 'stable' | 'uneasy' | 'torment' | 'abyss' | 'doom';
  /** Bônus percentual inteiro sobre ganhos diretos abissais. */
  readonly bonusPct: number;
}

/** Faixas da maldição. Bloqueio/consumo (60+, 90+) adiados para P2 (D017). */
export function curseBand(curse: number): CurseBand {
  if (curse >= 100) return { id: 'doom', bonusPct: 0 };
  if (curse >= 90) return { id: 'abyss', bonusPct: 100 };
  if (curse >= 60) return { id: 'torment', bonusPct: 50 };
  if (curse >= 30) return { id: 'uneasy', bonusPct: 25 };
  return { id: 'stable', bonusPct: 0 };
}

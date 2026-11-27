/**
 * Definições de regra das 12 relíquias do protótipo P1. Somente dados de regra:
 * nomes e descrições ficam em src/ui/strings.ts (chaves `relic.<id>.name/desc`).
 * Preços, raridades e pesos são hipóteses (D006), não números aprovados.
 */

export const RELIC_IDS = [
  'candle',
  'skull',
  'mirror',
  'bell',
  'eye',
  'hourglass',
  'book',
  'feather',
  'ring',
  'tooth',
  'coin',
  'thread',
] as const;
export type RelicId = (typeof RELIC_IDS)[number];

export type Trigger = 'start' | 'wake';
export type Rarity = 'common' | 'uncommon' | 'rare';
export type Tag = 'necromancy' | 'reflection' | 'abyss' | 'purification' | 'devouring' | 'temporal';

export interface RelicDef {
  readonly id: RelicId;
  readonly trigger: Trigger;
  readonly rarity: Rarity;
  readonly price: number;
  readonly tags: readonly Tag[];
  /** Ganho-base estático de moeda, quando existe (o que o Espelho pode copiar). */
  readonly baseGain?: number;
}

export const RELICS: Readonly<Record<RelicId, RelicDef>> = {
  candle: { id: 'candle', trigger: 'start', rarity: 'common', price: 4, tags: ['necromancy'] },
  skull: { id: 'skull', trigger: 'wake', rarity: 'common', price: 5, tags: ['necromancy'], baseGain: 10 },
  coin: { id: 'coin', trigger: 'start', rarity: 'common', price: 3, tags: ['purification'], baseGain: 4 },
  feather: { id: 'feather', trigger: 'start', rarity: 'common', price: 4, tags: ['purification'] },
  mirror: { id: 'mirror', trigger: 'wake', rarity: 'uncommon', price: 8, tags: ['reflection'] },
  bell: { id: 'bell', trigger: 'wake', rarity: 'uncommon', price: 7, tags: ['necromancy'] },
  thread: { id: 'thread', trigger: 'wake', rarity: 'uncommon', price: 7, tags: ['necromancy', 'abyss'] },
  tooth: { id: 'tooth', trigger: 'wake', rarity: 'uncommon', price: 8, tags: ['devouring'] },
  eye: { id: 'eye', trigger: 'wake', rarity: 'rare', price: 12, tags: ['abyss'] },
  hourglass: { id: 'hourglass', trigger: 'wake', rarity: 'rare', price: 13, tags: ['temporal'] },
  book: { id: 'book', trigger: 'wake', rarity: 'rare', price: 11, tags: ['abyss'], baseGain: 18 },
  ring: { id: 'ring', trigger: 'wake', rarity: 'rare', price: 11, tags: ['devouring'] },
};

/** Valores numéricos dos efeitos (fonte única para motor, testes e textos). */
export const EFFECT = {
  skullGain: 10,
  coinGain: 4,
  featherCurse: -5,
  bookGain: 18,
  bookCurse: 8,
  ringGain: 16,
  toothBase: 4,
  toothPerDestroyed: 3,
  threadCurse: 2,
} as const;

/**
 * Ganhos diretos que recebem o bônus abissal da faixa de maldição (D005/D013).
 * Só o Livro no P1; o Fio tem tag abyss mas não gera moeda.
 */
export const ABYSS_GAIN_RELICS: readonly RelicId[] = ['book'];

export function isRelicId(v: unknown): v is RelicId {
  return typeof v === 'string' && (RELIC_IDS as readonly string[]).includes(v);
}

export function sellPrice(id: RelicId): number {
  return Math.max(1, Math.floor(RELICS[id].price / 2));
}

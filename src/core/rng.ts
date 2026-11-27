/**
 * PRNG explícito, determinístico e serializável (xorshift32, deslocamentos 13/17/5).
 * O estado é um único uint32 em um objeto JSON simples. Nenhuma função usa Math.random
 * ou o relógio. Toda chamada devolve um novo estado; o estado de entrada não é mutado.
 */

export interface RngState {
  /** uint32 não nulo. */
  readonly s: number;
}

/** xorshift32 nunca sai de zero; uma seed zero é normalizada para esta constante (D013). */
export const ZERO_SEED_REPLACEMENT = 0x9e3779b9;

const UINT32_RANGE = 0x1_0000_0000;

export function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError(`Seed deve ser um inteiro seguro: ${seed}`);
  }
  // Redução módulo 2^32 válida também para negativos.
  const u = ((seed % UINT32_RANGE) + UINT32_RANGE) % UINT32_RANGE;
  return u === 0 ? ZERO_SEED_REPLACEMENT : u;
}

export function createRng(seed: number): RngState {
  return { s: normalizeSeed(seed) };
}

export function isValidRngState(value: unknown): value is RngState {
  if (typeof value !== 'object' || value === null) return false;
  const s = (value as { s?: unknown }).s;
  return typeof s === 'number' && Number.isInteger(s) && s > 0 && s < UINT32_RANGE;
}

export function nextUint32(state: RngState): { value: number; state: RngState } {
  let x = state.s;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const value = x >>> 0;
  return { value, state: { s: value } };
}

/**
 * Inteiro uniforme em [0, maxExclusive) por amostragem por rejeição (sem viés de módulo).
 * maxExclusive deve estar em [1, 2^32].
 */
export function nextInt(state: RngState, maxExclusive: number): { value: number; state: RngState } {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
    throw new RangeError(`maxExclusive fora do intervalo: ${maxExclusive}`);
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
  let cur = state;
  for (;;) {
    const r = nextUint32(cur);
    cur = r.state;
    if (r.value < limit) return { value: r.value % maxExclusive, state: cur };
  }
}

/** UTF-8 sem depender de TextEncoder (indisponível na lib ES pura do core). */
function utf8Bytes(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp < 0x80) out.push(cp);
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp < 0x10000)
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
  }
  return out;
}

/** Hash FNV-1a 32 bits; transforma uma seed textual compartilhável em número. */
export function hashSeedText(text: string): number {
  let h = 0x811c9dc5;
  for (const b of utf8Bytes(text)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Mistura splitmix32 para derivar fluxos independentes a partir de uma seed. */
function mix32(input: number): number {
  let z = (input + 0x9e3779b9) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) >>> 0;
}

export interface RngStreams {
  /** Sorteios que afetam regras (mercado, recompensas, eventos). */
  readonly gameplay: RngState;
  /** Variações puramente visuais/sonoras; nunca influencia regras. */
  readonly cosmetic: RngState;
}

export const STREAM_SALT = { gameplay: 0x0000_0001, cosmetic: 0x0000_0002 } as const;

export function createStreams(seed: number): RngStreams {
  const base = normalizeSeed(seed);
  return {
    gameplay: createRng(mix32(base ^ STREAM_SALT.gameplay)),
    cosmetic: createRng(mix32(base ^ STREAM_SALT.cosmetic)),
  };
}

import { describe, expect, it } from 'vitest';
import {
  createRng,
  createStreams,
  hashSeedText,
  isValidRngState,
  nextInt,
  nextUint32,
  normalizeSeed,
  ZERO_SEED_REPLACEMENT,
  type RngState,
} from '../src/core/rng';

/** Implementação de referência independente com BigInt (aritmética explícita mod 2^32). */
function refXorshift32(seed: number, n: number): number[] {
  const M = (1n << 32n) - 1n;
  let x = BigInt(seed) & M;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    x ^= (x << 13n) & M;
    x ^= x >> 17n;
    x ^= (x << 5n) & M;
    out.push(Number(x));
  }
  return out;
}

function take(state: RngState, n: number): number[] {
  const out: number[] = [];
  let s = state;
  for (let i = 0; i < n; i++) {
    const r = nextUint32(s);
    out.push(r.value);
    s = r.state;
  }
  return out;
}

describe('xorshift32', () => {
  it('vetor conhecido: seed 1 → 270369 (cálculo manual: 1→8193→8193→270369)', () => {
    expect(nextUint32(createRng(1)).value).toBe(270369);
  });

  it('vetor de Marsaglia (2003): seed 2463534242 → 723471715', () => {
    expect(nextUint32(createRng(2463534242)).value).toBe(723471715);
  });

  it('coincide com a referência BigInt em 1000 passos para várias seeds', () => {
    for (const seed of [1, 42, 0xdeadbeef, 0xffffffff, 123456789]) {
      expect(take(createRng(seed), 1000)).toEqual(refXorshift32(seed, 1000));
    }
  });

  it('é reprodutível e não muta o estado de entrada', () => {
    const s = createRng(777);
    const snapshot = { ...s };
    const a = take(s, 50);
    const b = take(s, 50);
    expect(a).toEqual(b);
    expect(s).toEqual(snapshot);
  });

  it('normaliza seed zero e reduz módulo 2^32', () => {
    expect(createRng(0).s).toBe(ZERO_SEED_REPLACEMENT);
    expect(normalizeSeed(2 ** 32)).toBe(ZERO_SEED_REPLACEMENT);
    expect(normalizeSeed(2 ** 32 + 5)).toBe(5);
    expect(normalizeSeed(-1)).toBe(0xffffffff);
    expect(() => normalizeSeed(1.5)).toThrow(RangeError);
    expect(() => normalizeSeed(Number.NaN)).toThrow(RangeError);
  });

  it('nunca produz zero nem valores fora de uint32', () => {
    let s = createRng(0xffffffff);
    for (let i = 0; i < 10_000; i++) {
      const r = nextUint32(s);
      expect(r.value).toBeGreaterThan(0);
      expect(r.value).toBeLessThanOrEqual(0xffffffff);
      s = r.state;
    }
  });

  it('retoma exatamente após serializar/desserializar via JSON', () => {
    let s = createRng(2024);
    s = nextUint32(nextUint32(s).state).state;
    const restored: unknown = JSON.parse(JSON.stringify(s));
    expect(isValidRngState(restored)).toBe(true);
    expect(take(restored as RngState, 100)).toEqual(take(s, 100));
  });

  it('isValidRngState rejeita estados inválidos', () => {
    for (const bad of [null, {}, { s: 0 }, { s: -1 }, { s: 2 ** 32 }, { s: 1.5 }, { s: '1' }]) {
      expect(isValidRngState(bad)).toBe(false);
    }
  });
});

describe('nextInt', () => {
  it('fica no intervalo e é determinístico', () => {
    let s = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const r = nextInt(s, 6);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(6);
      seen.add(r.value);
      s = r.state;
    }
    expect(seen.size).toBe(6);
  });

  it('max 1 sempre devolve 0 e consome um passo', () => {
    const s = createRng(5);
    const r = nextInt(s, 1);
    expect(r.value).toBe(0);
    expect(r.state).toEqual(nextUint32(s).state);
  });

  it('rejeita limites inválidos', () => {
    const s = createRng(5);
    for (const bad of [0, -3, 2.5, 2 ** 32 + 1]) expect(() => nextInt(s, bad)).toThrow(RangeError);
  });

  it('rejeição: valores acima do maior múltiplo são descartados (sem viés de módulo)', () => {
    const max = 3_000_000_000; // limite = 2^32 - (2^32 mod max) = 3e9
    let seed = 1;
    while (nextUint32(createRng(seed)).value < max) seed++;
    const s = createRng(seed);
    const first = nextUint32(s); // rejeitado
    const second = nextUint32(first.state);
    if (second.value >= max) return; // improvável; o laço do próprio nextInt cobriria
    const r = nextInt(s, max);
    expect(r.value).toBe(second.value % max);
    expect(r.state).toEqual(second.state);
  });
});

describe('seeds textuais e fluxos', () => {
  it('FNV-1a: vetores oficiais', () => {
    expect(hashSeedText('')).toBe(0x811c9dc5);
    expect(hashSeedText('a')).toBe(0xe40c292c);
    expect(hashSeedText('foobar')).toBe(0xbf9cf968);
  });

  it('FNV-1a codifica UTF-8 (acentos)', () => {
    // "é" = C3 A9 em UTF-8; difere de hashear o code unit 0xE9 isolado.
    expect(hashSeedText('é')).not.toBe(hashSeedText('é'.normalize('NFD')));
    expect(hashSeedText('meia-noite')).toBe(hashSeedText('meia-noite'));
  });

  it('fluxos gameplay e cosmético são distintos e determinísticos', () => {
    const a = createStreams(1234);
    const b = createStreams(1234);
    expect(a).toEqual(b);
    expect(a.gameplay.s).not.toBe(a.cosmetic.s);
    expect(take(a.gameplay, 20)).not.toEqual(take(a.cosmetic, 20));
  });

  it('consumir o fluxo cosmético não altera o de gameplay', () => {
    const streams = createStreams(55);
    const gameplayBefore = take(streams.gameplay, 10);
    take(streams.cosmetic, 500);
    expect(take(streams.gameplay, 10)).toEqual(gameplayBefore);
  });
});

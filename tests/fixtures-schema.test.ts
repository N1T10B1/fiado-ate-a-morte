/**
 * Validação estrutural das fixtures de QA (P0-02c). Não depende do resolvedor:
 * só garante que cada fixture é coerente consigo mesma e com os contratos de
 * src/core (tipos de evento, grade 5×5). O teste que roda as fixtures contra o
 * resolvedor real é de P1-002/P1-003 (thread 02). Ver docs/TEST_PLAN.md.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EVENT_TYPES } from '../src/core/events';
import { DEFAULT_GRID_SIZE } from '../src/core/grid';

const CATALOG = [
  'candle', 'skull', 'coin', 'feather', 'mirror', 'bell',
  'thread', 'tooth', 'eye', 'hourglass', 'book', 'ring',
] as const;

interface RelicSpec { id: number; def: string; row: number; col: number }
interface LogEntry {
  type: string;
  sourceId?: number;
  targetId?: number;
  amount?: number;
  delta?: number;
  truncated?: boolean;
}
interface ResolveFixture {
  id: string;
  category: string;
  title: string;
  decisions: string[];
  setup: { night: number; curse: number; destroyedThisRun: number; relics: RelicSpec[] };
  config?: { maxEvents: number };
  expected: {
    log: LogEntry[];
    gain: number;
    curse: number;
    defeat: boolean;
    truncated: boolean;
    destroyed: number[];
  };
}
interface RunFixture {
  id: string;
  category: string;
  title: string;
  decisions: string[];
  setup: { state?: { relics: RelicSpec[] } };
  steps: { action: { type: string }; expect: { ok: boolean } }[];
}

const dir = (sub: string): string => fileURLToPath(new URL(`./fixtures/${sub}/`, import.meta.url));
function load<T>(sub: string): { file: string; data: T }[] {
  return readdirSync(dir(sub))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ file, data: JSON.parse(readFileSync(dir(sub) + file, 'utf8')) as T }));
}

function checkBoard(relics: RelicSpec[]): void {
  const ids = new Set<number>();
  const cells = new Set<string>();
  for (const r of relics) {
    expect(Number.isInteger(r.id) && r.id >= 0, `id ${r.id}`).toBe(true);
    expect(CATALOG as readonly string[]).toContain(r.def);
    expect(r.row >= 0 && r.row < DEFAULT_GRID_SIZE && r.col >= 0 && r.col < DEFAULT_GRID_SIZE, `(${r.row},${r.col})`).toBe(true);
    expect(ids.has(r.id), `id duplicado ${r.id}`).toBe(false);
    expect(cells.has(`${r.row},${r.col}`), `célula dupla (${r.row},${r.col})`).toBe(false);
    ids.add(r.id);
    cells.add(`${r.row},${r.col}`);
  }
}

const resolve = load<ResolveFixture>('resolve');
const run = load<RunFixture>('run');

describe('fixtures de resolução', () => {
  it('existem e têm IDs únicos iguais ao nome do arquivo', () => {
    expect(resolve.length).toBeGreaterThanOrEqual(40);
    const ids = resolve.map((f) => f.data.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { file, data } of resolve) expect(file).toBe(`${data.id}.json`);
  });

  for (const { data: f } of resolve) {
    describe(`${f.id} — ${f.title}`, () => {
      const known = new Set(f.setup.relics.map((r) => r.id));
      const log = f.expected.log;

      it('bancada válida e maldição inicial em 0–99', () => {
        checkBoard(f.setup.relics);
        expect(f.setup.curse >= 0 && f.setup.curse <= 99).toBe(true);
        expect(f.decisions.length).toBeGreaterThan(0);
      });

      it('log usa só tipos do contrato, abre com START_NIGHT e fecha com END_NIGHT', () => {
        for (const e of log) expect(EVENT_TYPES as readonly string[]).toContain(e.type);
        expect(log[0]?.type).toBe('START_NIGHT');
        expect(log[log.length - 1]?.type).toBe('END_NIGHT');
        expect(log.filter((e) => e.type === 'START_NIGHT' || e.type === 'END_NIGHT')).toHaveLength(2);
        expect(log[log.length - 1]?.truncated).toBe(f.expected.truncated);
      });

      it('IDs do log existem na bancada; cada relíquia ativa no máximo uma vez (D001)', () => {
        const activated = new Set<number>();
        const dead = new Set<number>();
        for (const e of log) {
          if (e.sourceId !== undefined) expect(known.has(e.sourceId)).toBe(true);
          if (e.targetId !== undefined) expect(known.has(e.targetId)).toBe(true);
          if (e.type === 'ACTIVATE' && e.sourceId !== undefined) {
            expect(activated.has(e.sourceId), `#${e.sourceId} ativou duas vezes`).toBe(false);
            expect(dead.has(e.sourceId), `#${e.sourceId} ativou depois de destruída`).toBe(false);
            activated.add(e.sourceId);
          }
          if (e.type === 'DESTROY' && e.targetId !== undefined) dead.add(e.targetId);
        }
        expect([...dead].sort()).toEqual([...f.expected.destroyed].sort());
      });

      it('totais batem com o log (ganho, maldição, derrota)', () => {
        const gain = log
          .filter((e) => e.type === 'GAIN_CURRENCY' || e.type === 'COPY_EFFECT' || e.type === 'REPEAT_GAIN')
          .reduce((s, e) => s + (e.amount ?? 0), 0);
        const curse = log.filter((e) => e.type === 'CHANGE_CURSE').reduce((s, e) => s + (e.delta ?? 0), f.setup.curse);
        expect(gain).toBe(f.expected.gain);
        expect(curse).toBe(f.expected.curse);
        expect(f.expected.curse >= 0 && f.expected.curse <= 100).toBe(true);
        expect(f.expected.defeat).toBe(f.expected.curse === 100);
        if (f.expected.defeat) expect(log[log.length - 2]?.type).toBe('CHANGE_CURSE');
      });
    });
  }
});

describe('fixtures de partida', () => {
  it('existem e têm IDs únicos iguais ao nome do arquivo', () => {
    expect(run.length).toBeGreaterThanOrEqual(15);
    for (const { file, data } of run) expect(file).toBe(`${data.id}.json`);
  });
  for (const { data: f } of run) {
    it(`${f.id} — bancada válida e passos com expectativa`, () => {
      if (f.setup.state) checkBoard(f.setup.state.relics);
      expect(f.steps.length).toBeGreaterThan(0);
      for (const s of f.steps) expect(typeof s.expect.ok).toBe('boolean');
    });
  }
});

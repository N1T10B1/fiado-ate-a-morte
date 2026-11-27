/**
 * Roda as fixtures de resolução da thread de QA (tests/fixtures/resolve/*.json, formato em
 * docs/TEST_PLAN.md §3) contra o motor real. Sem fixtures no checkout, o arquivo não testa nada.
 * Uma divergência é defeito do motor ou da fixture: registrar, nunca ajustar em silêncio.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createGrid, place, type Grid } from '../src/core/grid';
import { resolveNight } from '../src/core/resolve';
import { isRelicId, type RelicId } from '../src/core/relics';

const DIR = process.env.QA_FIXTURES_DIR ?? join(import.meta.dirname, 'fixtures', 'resolve');
// Tipos do contrato original usados pelas fixtures; ARM_MULTIPLIER e NO_EFFECT são informativos (D019).
const CONTRACT = new Set(['START_NIGHT', 'ACTIVATE', 'GAIN_CURRENCY', 'CHANGE_CURSE', 'COPY_EFFECT', 'REPEAT_GAIN', 'DESTROY', 'END_NIGHT']);

interface Fixture {
  id: string;
  title: string;
  setup: { night: number; curse: number; destroyedThisRun: number; relics: { id: number; def: string; row: number; col: number }[] };
  config?: { maxEvents?: number };
  expected: { log: Record<string, unknown>[]; gain: number; curse: number; defeat: boolean; truncated: boolean; destroyed: number[] };
}

const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.json')).sort() : [];

describe.skipIf(files.length === 0)('fixtures de QA contra o motor', () => {
  it.each(files)('%s', (file) => {
    const fx = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as Fixture;
    let grid: Grid = createGrid(5);
    const instances: Record<number, { relic: RelicId }> = {};
    for (const r of fx.setup.relics) {
      if (!isRelicId(r.def)) throw new Error(`${fx.id}: relíquia desconhecida ${r.def}`);
      const p = place(grid, { row: r.row, col: r.col }, r.id);
      if (!p.ok) throw new Error(`${fx.id}: ${p.error}`);
      grid = p.value;
      instances[r.id] = { relic: r.def };
    }
    const res = resolveNight({
      grid,
      instances,
      curse: fx.setup.curse,
      destroyedThisRun: fx.setup.destroyedThisRun,
      night: fx.setup.night,
      ...(fx.config?.maxEvents !== undefined ? { maxEvents: fx.config.maxEvents } : {}),
    });
    const log = res.events
      .filter((e) => CONTRACT.has(e.type))
      .map((e) => (e.type === 'END_NIGHT' ? { ...e, truncated: e.outcome === 'truncated', defeat: e.outcome === 'curse_defeat' } : e));
    expect(log.length, `${fx.id} ${fx.title}`).toBe(fx.expected.log.length);
    fx.expected.log.forEach((exp, i) => expect(log[i], `${fx.id} evento ${i}`).toMatchObject(exp));
    expect({
      gain: res.gain,
      curse: res.curse,
      defeat: res.outcome === 'curse_defeat',
      truncated: res.outcome === 'truncated',
      destroyed: res.destroyedIds,
    }).toEqual({
      gain: fx.expected.gain,
      curse: fx.expected.curse,
      defeat: fx.expected.defeat,
      truncated: fx.expected.truncated,
      destroyed: fx.expected.destroyed,
    });
  });
});

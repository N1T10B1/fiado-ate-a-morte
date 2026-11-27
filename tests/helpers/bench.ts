import { createGrid, place, type Grid, type InstanceId } from '../../src/core/grid';
import type { Instances, NightInput } from '../../src/core/resolve';
import type { RelicId } from '../../src/core/relics';

/** Monta uma bancada a partir de {'linha,coluna': relíquia}. IDs seguem a ordem das chaves, a partir de 1. */
export function bench(layout: Record<string, RelicId>): { grid: Grid; instances: Instances; idAt: (k: string) => InstanceId } {
  let grid = createGrid(5);
  const instances: Record<number, { relic: RelicId }> = {};
  const ids: Record<string, number> = {};
  let id = 1;
  for (const [k, relic] of Object.entries(layout)) {
    const [row, col] = k.split(',').map(Number) as [number, number];
    const r = place(grid, { row, col }, id);
    if (!r.ok) throw new Error(`${k}: ${r.error}`);
    grid = r.value;
    instances[id] = { relic };
    ids[k] = id++;
  }
  return {
    grid,
    instances,
    idAt: (k) => {
      const v = ids[k];
      if (v === undefined) throw new Error(`sem relíquia em ${k}`);
      return v;
    },
  };
}

export function night(layout: Record<string, RelicId>, extra: Partial<NightInput> = {}): NightInput & ReturnType<typeof bench> {
  const b = bench(layout);
  return { ...b, curse: 0, destroyedThisRun: 0, night: 1, ...extra };
}

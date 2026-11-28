import { describe, expect, it } from 'vitest';
import {
  createGrid,
  findCoord,
  getAt,
  inBounds,
  leftOf,
  move,
  neighbors,
  occupiedInReadingOrder,
  place,
  remove,
  swap,
  type Grid,
} from '../src/core/grid';

function mustPlace(g: Grid, row: number, col: number, id: number): Grid {
  const r = place(g, { row, col }, id);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

describe('grade', () => {
  it('cria 5×5 vazia por padrão e aceita dimensão configurável', () => {
    const g = createGrid();
    expect([g.rows, g.cols, g.cells.length]).toEqual([5, 5, 25]);
    expect(g.cells.every((c) => c === null)).toBe(true);
    const h = createGrid(3, 4);
    expect([h.rows, h.cols, h.cells.length]).toEqual([3, 4, 12]);
    expect(() => createGrid(0)).toThrow(RangeError);
    expect(() => createGrid(2.5)).toThrow(RangeError);
  });

  it('limites', () => {
    const g = createGrid();
    expect(inBounds(g, { row: 0, col: 0 })).toBe(true);
    expect(inBounds(g, { row: 4, col: 4 })).toBe(true);
    for (const c of [{ row: -1, col: 0 }, { row: 0, col: 5 }, { row: 5, col: 0 }, { row: 0.5, col: 0 }])
      expect(inBounds(g, c)).toBe(false);
  });

  it('ocupação única: célula ocupada e ID duplicado são rejeitados sem mutação', () => {
    const g = mustPlace(createGrid(), 1, 1, 7);
    const before = JSON.stringify(g);
    expect(place(g, { row: 1, col: 1 }, 8)).toEqual({ ok: false, error: 'cell_occupied' });
    expect(place(g, { row: 2, col: 2 }, 7)).toEqual({ ok: false, error: 'id_already_placed' });
    expect(place(g, { row: 9, col: 9 }, 8)).toEqual({ ok: false, error: 'out_of_bounds' });
    expect(place(g, { row: 0, col: 0 }, -1)).toEqual({ ok: false, error: 'invalid_id' });
    expect(JSON.stringify(g)).toBe(before);
  });

  it('place/remove não mutam a grade original', () => {
    const g = createGrid();
    const g2 = mustPlace(g, 0, 0, 1);
    expect(getAt(g, { row: 0, col: 0 })).toBeNull();
    const r = remove(g2, { row: 0, col: 0 });
    expect(r.ok && r.value.id).toBe(1);
    expect(getAt(g2, { row: 0, col: 0 })).toBe(1);
    expect(remove(g, { row: 0, col: 0 })).toEqual({ ok: false, error: 'cell_empty' });
  });

  it('move preserva o ID e exige destino vazio', () => {
    let g = mustPlace(createGrid(), 0, 0, 3);
    g = mustPlace(g, 0, 1, 4);
    const blocked = move(g, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(blocked).toEqual({ ok: false, error: 'cell_occupied' });
    const r = move(g, { row: 0, col: 0 }, { row: 4, col: 4 });
    if (!r.ok) throw new Error(r.error);
    expect(findCoord(r.value, 3)).toEqual({ row: 4, col: 4 });
    expect(getAt(r.value, { row: 0, col: 0 })).toBeNull();
    expect(findCoord(g, 3)).toEqual({ row: 0, col: 0 });
    expect(move(g, { row: 2, col: 2 }, { row: 3, col: 3 })).toEqual({ ok: false, error: 'cell_empty' });
    expect(move(g, { row: 0, col: 0 }, { row: 0, col: 0 })).toEqual({ ok: false, error: 'same_cell' });
    expect(move(g, { row: 0, col: 0 }, { row: 0, col: 9 })).toEqual({ ok: false, error: 'out_of_bounds' });
  });

  it('swap é atômico, aceita célula vazia e rejeita casos inválidos', () => {
    let g = mustPlace(createGrid(), 0, 0, 1);
    g = mustPlace(g, 2, 3, 2);
    const r = swap(g, { row: 0, col: 0 }, { row: 2, col: 3 });
    if (!r.ok) throw new Error(r.error);
    expect(findCoord(r.value, 1)).toEqual({ row: 2, col: 3 });
    expect(findCoord(r.value, 2)).toEqual({ row: 0, col: 0 });
    const toEmpty = swap(g, { row: 0, col: 0 }, { row: 4, col: 4 });
    expect(toEmpty.ok && findCoord(toEmpty.value, 1)).toEqual({ row: 4, col: 4 });
    expect(swap(g, { row: 1, col: 1 }, { row: 3, col: 3 })).toEqual({ ok: false, error: 'cell_empty' });
    expect(swap(g, { row: 0, col: 0 }, { row: 0, col: 0 })).toEqual({ ok: false, error: 'same_cell' });
    expect(swap(g, { row: 0, col: 0 }, { row: -1, col: 0 })).toEqual({ ok: false, error: 'out_of_bounds' });
    expect(findCoord(g, 1)).toEqual({ row: 0, col: 0 });
  });

  it('nenhum item ocupa dois lugares após sequência de operações', () => {
    let g = createGrid();
    for (let id = 0; id < 25; id++) g = mustPlace(g, Math.floor(id / 5), id % 5, id);
    for (let i = 0; i < 100; i++) {
      const a = { row: i % 5, col: (i * 3) % 5 };
      const b = { row: (i * 2) % 5, col: (i * 7) % 5 };
      const r = swap(g, a, b);
      if (r.ok) g = r.value;
    }
    const ids = g.cells.filter((c) => c !== null);
    expect(new Set(ids).size).toBe(25);
  });

  it('vizinhos N/E/S/O no centro, bordas e cantos', () => {
    const g = createGrid();
    const dirs = (row: number, col: number) => neighbors(g, { row, col }).map((n) => n.dir).join('');
    expect(dirs(2, 2)).toBe('NESO');
    expect(neighbors(g, { row: 2, col: 2 }).map((n) => n.coord)).toEqual([
      { row: 1, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 2 },
      { row: 2, col: 1 },
    ]);
    expect(dirs(0, 0)).toBe('ES');
    expect(dirs(0, 4)).toBe('SO');
    expect(dirs(4, 0)).toBe('NE');
    expect(dirs(4, 4)).toBe('NO');
    expect(dirs(0, 2)).toBe('ESO');
    expect(dirs(4, 2)).toBe('NEO');
    expect(dirs(2, 0)).toBe('NES');
    expect(dirs(2, 4)).toBe('NSO');
    expect(neighbors(g, { row: 7, col: 7 })).toEqual([]);
  });

  it('leftOf: célula à esquerda ou null na coluna 0', () => {
    const g = createGrid();
    expect(leftOf(g, { row: 3, col: 2 })).toEqual({ row: 3, col: 1 });
    expect(leftOf(g, { row: 3, col: 0 })).toBeNull();
  });

  it('ordem de leitura: linha e depois coluna, independente do ID', () => {
    let g = mustPlace(createGrid(), 2, 1, 5);
    g = mustPlace(g, 0, 4, 9);
    g = mustPlace(g, 2, 0, 1);
    g = mustPlace(g, 0, 0, 30);
    expect(occupiedInReadingOrder(g).map((o) => o.id)).toEqual([30, 9, 1, 5]);
  });

  it('é serializável em JSON sem perda', () => {
    const g = mustPlace(createGrid(), 1, 2, 11);
    expect(JSON.parse(JSON.stringify(g))).toEqual(g);
  });
});

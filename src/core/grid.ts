/**
 * Bancada (grade) pura e imutável. Cada célula guarda no máximo um ID de instância.
 * IDs são estáveis e independentes da posição; mover não altera o ID.
 * Toda operação inválida devolve erro e não altera a grade original.
 */
import { err, ok, type Result } from './result';

export type InstanceId = number;

export interface Coord {
  readonly row: number;
  readonly col: number;
}

/** Ordem canônica de vizinhança: Norte, Leste, Sul, Oeste. */
export const DIRECTIONS = ['N', 'E', 'S', 'O'] as const;
export type Direction = (typeof DIRECTIONS)[number];

const OFFSETS: Readonly<Record<Direction, Coord>> = {
  N: { row: -1, col: 0 },
  E: { row: 0, col: 1 },
  S: { row: 1, col: 0 },
  O: { row: 0, col: -1 },
};

export interface Grid {
  readonly rows: number;
  readonly cols: number;
  /** Células em ordem de leitura (linha, depois coluna). `null` = vazia. */
  readonly cells: readonly (InstanceId | null)[];
}

export type GridError =
  | 'out_of_bounds'
  | 'cell_occupied'
  | 'cell_empty'
  | 'id_already_placed'
  | 'invalid_id'
  | 'same_cell';

export const DEFAULT_GRID_SIZE = 5;

export function createGrid(rows: number = DEFAULT_GRID_SIZE, cols: number = rows): Grid {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new RangeError(`Dimensões de grade inválidas: ${rows}×${cols}`);
  }
  return { rows, cols, cells: new Array<InstanceId | null>(rows * cols).fill(null) };
}

export function inBounds(grid: Grid, c: Coord): boolean {
  return (
    Number.isInteger(c.row) &&
    Number.isInteger(c.col) &&
    c.row >= 0 &&
    c.col >= 0 &&
    c.row < grid.rows &&
    c.col < grid.cols
  );
}

function indexOf(grid: Grid, c: Coord): number {
  return c.row * grid.cols + c.col;
}

function coordOf(grid: Grid, index: number): Coord {
  return { row: Math.floor(index / grid.cols), col: index % grid.cols };
}

function withCells(grid: Grid, cells: (InstanceId | null)[]): Grid {
  return { rows: grid.rows, cols: grid.cols, cells };
}

export function getAt(grid: Grid, c: Coord): InstanceId | null {
  if (!inBounds(grid, c)) return null;
  return grid.cells[indexOf(grid, c)] ?? null;
}

export function findCoord(grid: Grid, id: InstanceId): Coord | null {
  const i = grid.cells.indexOf(id);
  return i === -1 ? null : coordOf(grid, i);
}

export function place(grid: Grid, c: Coord, id: InstanceId): Result<Grid, GridError> {
  if (!Number.isSafeInteger(id) || id < 0) return err('invalid_id');
  if (!inBounds(grid, c)) return err('out_of_bounds');
  if (getAt(grid, c) !== null) return err('cell_occupied');
  if (grid.cells.includes(id)) return err('id_already_placed');
  const cells = grid.cells.slice();
  cells[indexOf(grid, c)] = id;
  return ok(withCells(grid, cells));
}

export function remove(grid: Grid, c: Coord): Result<{ grid: Grid; id: InstanceId }, GridError> {
  if (!inBounds(grid, c)) return err('out_of_bounds');
  const id = getAt(grid, c);
  if (id === null) return err('cell_empty');
  const cells = grid.cells.slice();
  cells[indexOf(grid, c)] = null;
  return ok({ grid: withCells(grid, cells), id });
}

/** Move o objeto de `from` para uma célula vazia `to`. */
export function move(grid: Grid, from: Coord, to: Coord): Result<Grid, GridError> {
  if (!inBounds(grid, from) || !inBounds(grid, to)) return err('out_of_bounds');
  if (from.row === to.row && from.col === to.col) return err('same_cell');
  const id = getAt(grid, from);
  if (id === null) return err('cell_empty');
  if (getAt(grid, to) !== null) return err('cell_occupied');
  const cells = grid.cells.slice();
  cells[indexOf(grid, from)] = null;
  cells[indexOf(grid, to)] = id;
  return ok(withCells(grid, cells));
}

/**
 * Troca atômica do conteúdo de duas células. Aceita uma delas vazia
 * (equivale a mover); rejeita duas vazias ou a mesma célula.
 */
export function swap(grid: Grid, a: Coord, b: Coord): Result<Grid, GridError> {
  if (!inBounds(grid, a) || !inBounds(grid, b)) return err('out_of_bounds');
  if (a.row === b.row && a.col === b.col) return err('same_cell');
  const ia = indexOf(grid, a);
  const ib = indexOf(grid, b);
  const va = grid.cells[ia] ?? null;
  const vb = grid.cells[ib] ?? null;
  if (va === null && vb === null) return err('cell_empty');
  const cells = grid.cells.slice();
  cells[ia] = vb;
  cells[ib] = va;
  return ok(withCells(grid, cells));
}

/** Vizinhos ortogonais dentro da grade, sempre na ordem N, E, S, O. */
export function neighbors(grid: Grid, c: Coord): { dir: Direction; coord: Coord }[] {
  if (!inBounds(grid, c)) return [];
  const out: { dir: Direction; coord: Coord }[] = [];
  for (const dir of DIRECTIONS) {
    const o = OFFSETS[dir];
    const n = { row: c.row + o.row, col: c.col + o.col };
    if (inBounds(grid, n)) out.push({ dir, coord: n });
  }
  return out;
}

/** Célula imediatamente à esquerda (Oeste), usada pelo Espelho partido. */
export function leftOf(grid: Grid, c: Coord): Coord | null {
  const n = { row: c.row, col: c.col - 1 };
  return inBounds(grid, n) ? n : null;
}

/** Objetos ocupados em ordem de leitura (linha, depois coluna). */
export function occupiedInReadingOrder(grid: Grid): { id: InstanceId; coord: Coord }[] {
  const out: { id: InstanceId; coord: Coord }[] = [];
  grid.cells.forEach((id, i) => {
    if (id !== null) out.push({ id, coord: coordOf(grid, i) });
  });
  return out;
}

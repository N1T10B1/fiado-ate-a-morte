/**
 * Fila FIFO persistente (imutável). Usada pelo resolvedor de noite: efeitos derivados
 * entram no fim. O limite de 256 eventos por noite pertence ao resolvedor (P1-002),
 * não a esta estrutura genérica.
 */

export interface Queue<T> {
  readonly items: readonly T[];
  /** Índice do próximo item a sair. */
  readonly head: number;
}

export function emptyQueue<T>(): Queue<T> {
  return { items: [], head: 0 };
}

export function queueFrom<T>(items: readonly T[]): Queue<T> {
  return { items: items.slice(), head: 0 };
}

export function size<T>(q: Queue<T>): number {
  return q.items.length - q.head;
}

export function isEmpty<T>(q: Queue<T>): boolean {
  return size(q) === 0;
}

export function enqueue<T>(q: Queue<T>, ...values: T[]): Queue<T> {
  if (values.length === 0) return q;
  return { items: [...q.items.slice(q.head), ...values], head: 0 };
}

export function peek<T>(q: Queue<T>): T | undefined {
  return isEmpty(q) ? undefined : q.items[q.head];
}

/** Remove o primeiro item. Em fila vazia devolve `null` e a mesma fila. */
export function dequeue<T>(q: Queue<T>): { value: T; queue: Queue<T> } | null {
  if (isEmpty(q)) return null;
  return { value: q.items[q.head] as T, queue: { items: q.items, head: q.head + 1 } };
}

export function toArray<T>(q: Queue<T>): T[] {
  return q.items.slice(q.head);
}

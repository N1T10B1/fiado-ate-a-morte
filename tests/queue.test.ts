import { describe, expect, it } from 'vitest';
import { dequeue, emptyQueue, enqueue, isEmpty, peek, queueFrom, size, toArray } from '../src/core/queue';

describe('fila FIFO', () => {
  it('preserva a ordem de inserção', () => {
    let q = enqueue(emptyQueue<string>(), 'a', 'b', 'c');
    const out: string[] = [];
    for (let r = dequeue(q); r; r = dequeue(q)) {
      out.push(r.value);
      q = r.queue;
    }
    expect(out).toEqual(['a', 'b', 'c']);
    expect(isEmpty(q)).toBe(true);
  });

  it('efeitos acrescentados após remoções entram no fim', () => {
    let q = queueFrom([1, 2, 3]);
    const r1 = dequeue(q)!;
    q = enqueue(r1.queue, 10, 11);
    const r2 = dequeue(q)!;
    q = enqueue(r2.queue, 20);
    expect([r1.value, r2.value]).toEqual([1, 2]);
    expect(toArray(q)).toEqual([3, 10, 11, 20]);
  });

  it('fila vazia: dequeue devolve null, peek undefined, sem mutação', () => {
    const q = emptyQueue<number>();
    expect(dequeue(q)).toBeNull();
    expect(peek(q)).toBeUndefined();
    expect(size(q)).toBe(0);
    expect(q).toEqual({ items: [], head: 0 });
  });

  it('operações não mutam a fila anterior (persistente)', () => {
    const base = queueFrom(['x', 'y']);
    const frozen = JSON.stringify(base);
    const r = dequeue(base)!;
    enqueue(base, 'z');
    enqueue(r.queue, 'w');
    expect(JSON.stringify(base)).toBe(frozen);
    expect(toArray(base)).toEqual(['x', 'y']);
    expect(toArray(r.queue)).toEqual(['y']);
  });

  it('queueFrom copia o array de origem', () => {
    const src = [1, 2];
    const q = queueFrom(src);
    src.push(3);
    expect(toArray(q)).toEqual([1, 2]);
  });

  it('enqueue sem valores devolve a mesma fila', () => {
    const q = queueFrom([1]);
    expect(enqueue(q)).toBe(q);
  });

  it('suporta centenas de itens em ordem (escala do limite de 256 eventos)', () => {
    let q = emptyQueue<number>();
    const out: number[] = [];
    for (let i = 0; i < 300; i++) {
      q = enqueue(q, i);
      if (i % 3 === 0) {
        const r = dequeue(q)!;
        out.push(r.value);
        q = r.queue;
      }
    }
    for (let r = dequeue(q); r; r = dequeue(q)) {
      out.push(r.value);
      q = r.queue;
    }
    expect(out).toEqual(Array.from({ length: 300 }, (_, i) => i));
  });
});

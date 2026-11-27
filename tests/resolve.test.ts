import { describe, expect, it } from 'vitest';
import { resolveNight } from '../src/core/resolve';
import { night } from './helpers/bench';

const types = (r: ReturnType<typeof resolveNight>) => r.events.map((e) => e.type);
const activations = (r: ReturnType<typeof resolveNight>) =>
  r.events.flatMap((e) => (e.type === 'ACTIVATE' ? [e.sourceId] : []));

describe('resolvedor: fila e gatilhos', () => {
  it('bancada vazia: só START/END, nada muda', () => {
    const r = resolveNight(night({}));
    expect(types(r)).toEqual(['START_NIGHT', 'END_NIGHT']);
    expect([r.gain, r.curse, r.outcome]).toEqual([0, 0, 'complete']);
  });

  it('tutorial: vela desperta crânio adjacente (+10)', () => {
    const r = resolveNight(night({ '2,1': 'candle', '2,2': 'skull' }));
    expect(r.gain).toBe(10);
    expect(types(r)).toEqual(['START_NIGHT', 'ACTIVATE', 'ACTIVATE', 'GAIN_CURRENCY', 'END_NIGHT']);
  });

  it('crânio sem vela não ativa', () => {
    expect(resolveNight(night({ '0,0': 'candle', '4,4': 'skull' })).gain).toBe(0);
  });

  it('relíquias de início entram em ordem de leitura (linha, depois coluna), não por ID', () => {
    const n = night({ '3,0': 'coin', '0,4': 'coin', '0,1': 'feather' });
    const r = resolveNight(n);
    expect(activations(r)).toEqual([n.idAt('0,1'), n.idAt('0,4'), n.idAt('3,0')]);
    expect(r.gain).toBe(8);
  });

  it('vela desperta vizinhos na ordem N, E, S, O; derivados vão para o fim da fila', () => {
    const n = night({ '2,2': 'candle', '2,1': 'skull', '3,2': 'skull', '2,3': 'skull', '1,2': 'skull', '0,0': 'coin' });
    const r = resolveNight(n);
    expect(activations(r)).toEqual([n.idAt('0,0'), n.idAt('2,2'), n.idAt('1,2'), n.idAt('2,3'), n.idAt('3,2'), n.idAt('2,1')]);
    expect(r.gain).toBe(44);
  });

  it('vela não desperta relíquias de início (D001)', () => {
    const n = night({ '2,2': 'candle', '2,3': 'coin', '2,1': 'candle' });
    const r = resolveNight(n);
    expect(activations(r).length).toBe(3); // cada uma ativa uma vez, por conta própria
    expect(r.gain).toBe(4);
  });

  it('duas velas não fazem o mesmo crânio ativar duas vezes (D001)', () => {
    const r = resolveNight(night({ '2,1': 'candle', '2,2': 'skull', '2,3': 'candle' }));
    expect(r.gain).toBe(10);
  });
});

describe('resolvedor: relíquias', () => {
  it('pena: −5 maldição, mínimo zero', () => {
    expect(resolveNight(night({ '0,0': 'feather' }, { curse: 12 })).curse).toBe(7);
    const r = resolveNight(night({ '0,0': 'feather' }, { curse: 3 }));
    expect(r.curse).toBe(0);
    expect(r.events.find((e) => e.type === 'CHANGE_CURSE')).toMatchObject({ delta: -3, curse: 0 });
  });

  it('livro: +18 e depois +8 maldição', () => {
    const r = resolveNight(night({ '0,0': 'candle', '0,1': 'book' }));
    expect([r.gain, r.curse]).toEqual([18, 8]);
    expect(types(r).slice(3, 5)).toEqual(['GAIN_CURRENCY', 'CHANGE_CURSE']);
  });

  it('espelho copia o ganho-base estático da esquerda, mesmo inativa, sem maldição', () => {
    const r = resolveNight(night({ '1,0': 'book', '1,1': 'mirror', '2,1': 'candle' }));
    expect([r.gain, r.curse]).toEqual([18, 0]);
    expect(r.events.some((e) => e.type === 'COPY_EFFECT' && e.amount === 18)).toBe(true);
  });

  it('espelho sem ganho-base à esquerda não faz nada', () => {
    const r = resolveNight(night({ '1,0': 'bell', '1,1': 'mirror', '2,1': 'candle' }));
    expect(r.gain).toBe(0);
    expect(r.events.some((e) => e.type === 'NO_EFFECT' && e.reason === 'no_copy_source')).toBe(true);
    const edge = resolveNight(night({ '1,0': 'mirror', '2,0': 'candle' }));
    expect(edge.gain).toBe(0);
  });

  it('olho dobra o próximo ganho direto de outra relíquia, um token por ganho', () => {
    // vela (2,2): N olho, E crânio, S crânio
    const r = resolveNight(night({ '2,2': 'candle', '1,2': 'eye', '2,3': 'skull', '3,2': 'skull' }));
    expect(r.gain).toBe(30); // 20 + 10
  });

  it('olho não dobra cópia nem repetição; guarda o token para o próximo ganho direto', () => {
    const n = night({ '2,2': 'candle', '1,2': 'eye', '3,2': 'mirror', '3,1': 'coin', '2,1': 'skull' });
    const r = resolveNight(n);
    // Fila: vela (2,2), moeda (3,1). Vela enfileira olho (N), espelho (S), crânio (O).
    // Moeda +4 antes do olho; espelho copia 4 sem dobrar; crânio 10×2.
    expect(r.gain).toBe(4 + 4 + 20);
  });

  it('ampulheta repete o último ganho direto creditado (com bônus já aplicados), sem novo multiplicador', () => {
    const r = resolveNight(night({ '2,2': 'candle', '1,2': 'eye', '2,3': 'skull', '3,2': 'hourglass' }));
    expect(r.gain).toBe(40); // 20 + repete 20
  });

  it('ampulheta sem ganho anterior não faz nada', () => {
    const r = resolveNight(night({ '2,2': 'candle', '1,2': 'hourglass', '2,3': 'skull' }));
    expect(r.gain).toBe(10);
  });

  it('sino enfileira todos os crânios inativos em ordem de leitura', () => {
    const n = night({ '2,2': 'candle', '2,3': 'bell', '4,4': 'skull', '0,0': 'skull' });
    const r = resolveNight(n);
    expect(r.gain).toBe(20);
    expect(activations(r).slice(-2)).toEqual([n.idAt('0,0'), n.idAt('4,4')]);
  });

  it('fio desperta o primeiro vizinho inativo e soma +2 maldição, mesmo sem alvo', () => {
    const r = resolveNight(night({ '2,2': 'candle', '2,3': 'thread', '3,3': 'skull' }));
    expect([r.gain, r.curse]).toEqual([10, 2]);
    const alone = resolveNight(night({ '2,2': 'candle', '2,3': 'thread' }));
    expect([alone.gain, alone.curse]).toEqual([0, 2]);
  });

  it('anel destrói o primeiro vizinho N/E/S/O e ganha +16; destruído não ativa depois', () => {
    // vela (2,2) desperta N anel (1,2) e E crânio (2,3). Anel ativa antes do crânio e destrói o vizinho N (0,2).
    const n = night({ '2,2': 'candle', '1,2': 'ring', '0,2': 'skull', '2,3': 'skull' });
    const r = resolveNight(n);
    expect(r.destroyedIds).toEqual([n.idAt('0,2')]);
    expect(r.gain).toBe(26);
    expect(r.grid.cells.includes(n.idAt('0,2'))).toBe(false);
  });

  it('anel escolhe o primeiro vizinho vivo em N/E/S/O, inclusive relíquia já ativada', () => {
    // Fila após a vela: anel (N), crânio (1,2) (E). O anel destrói o crânio (0,2), à sua direita.
    const n = night({ '1,1': 'candle', '0,1': 'ring', '1,2': 'skull', '0,2': 'skull' });
    const r = resolveNight(n);
    expect(r.gain).toBe(26);
    const n2 = night({ '1,1': 'candle', '1,2': 'ring', '2,1': 'skull' });
    // fila: anel (E), crânio (S). Anel vizinhos: N(0,2) vazio, E(1,3) vazio, S(2,2) vazio, O(1,1) vela → destrói a vela (já ativada).
    const r2 = resolveNight(n2);
    expect(r2.destroyedIds).toEqual([n2.idAt('1,1')]);
    expect(r2.gain).toBe(26);
    const n3 = night({ '1,1': 'candle', '0,1': 'ring', '1,2': 'skull', '0,0': 'feather' });
    // fila: pena(0,0), vela. Vela: N anel, E crânio. Anel: vizinhos E (0,2) vazio, S (1,1) vela → destrói vela (ativada). Crânio ainda ativa.
    const r3 = resolveNight(n3);
    expect(r3.gain).toBe(26);
  });

  it('anel destrói um crânio enfileirado antes de ele ativar', () => {
    // Vela: N sino (1,2), E anel (2,3). O sino enfileira o crânio (1,3); o anel destrói esse crânio (seu N) antes de ele ativar.
    const n = night({ '2,2': 'candle', '1,2': 'bell', '2,3': 'ring', '1,3': 'skull' });
    const r = resolveNight(n);
    expect(r.destroyedIds).toEqual([n.idAt('1,3')]);
    expect(activations(r)).not.toContain(n.idAt('1,3'));
    expect(r.gain).toBe(16);
  });

  it('anel sempre tem alvo no P1: quem o desperta (vela ou fio) é vizinho vivo', () => {
    // Quem desperta o anel é vizinho vivo, então ele sempre tem alvo; aqui a vela é o único vizinho.
    const r = resolveNight(night({ '0,0': 'candle', '1,0': 'ring' }));
    expect([r.gain, r.destroyedIds.length]).toEqual([16, 1]);
  });

  it('dente: +4 +3 por destruída na partida (inclui as desta noite)', () => {
    expect(resolveNight(night({ '0,0': 'candle', '0,1': 'tooth' }, { destroyedThisRun: 2 })).gain).toBe(10);
    // vela (2,2): N anel (1,2) destrói (0,2), E dente (2,3) → 4 + 3×1
    const r = resolveNight(night({ '2,2': 'candle', '1,2': 'ring', '0,2': 'coin', '2,3': 'tooth' }));
    // moeda (0,2) é início e ativa antes (+4); depois destruída (+16); dente +7
    expect(r.gain).toBe(4 + 16 + 7);
    expect(r.destroyedThisRun).toBe(1);
  });
});

describe('combo de 60 (A01)', () => {
  it('duas velas + fio fecham exatamente 60 óbolos e +2 maldição', () => {
    const r = resolveNight(
      night({
        '0,0': 'skull',
        '0,1': 'mirror',
        '1,0': 'bell',
        '1,1': 'candle',
        '1,2': 'skull',
        '2,1': 'eye',
        '3,3': 'candle',
        '3,4': 'thread',
        '2,4': 'hourglass',
      }),
    );
    expect(r.gain).toBe(60);
    expect(r.curse).toBe(2);
    const gains = r.events.flatMap((e) =>
      e.type === 'GAIN_CURRENCY' || e.type === 'COPY_EFFECT' || e.type === 'REPEAT_GAIN' ? [`${e.type}:${e.amount}`] : [],
    );
    expect(gains).toEqual(['COPY_EFFECT:10', 'GAIN_CURRENCY:10', 'GAIN_CURRENCY:20', 'REPEAT_GAIN:20']);
  });
});

describe('maldição: faixas e derrota', () => {
  const book = (curse: number) => resolveNight(night({ '0,0': 'candle', '0,1': 'book' }, { curse }));
  it.each([
    [29, 18],
    [30, 22],
    [59, 22],
    [60, 27],
    [89, 27],
    [90, 36],
  ])('livro com maldição %i na abertura rende %i', (curse, gain) => {
    // 90 + 8 = 98: sem derrota
    expect(book(curse).gain).toBe(gain);
  });

  it('faixa é congelada na abertura: subir de faixa no meio da noite não muda o bônus', () => {
    // dois livros: 25 → 33 → 41; ambos ganham sem bônus (faixa estável na abertura)
    const r = resolveNight(night({ '1,1': 'candle', '0,1': 'book', '1,2': 'book' }, { curse: 25 }));
    expect([r.gain, r.curse]).toEqual([36, 41]);
  });

  it('99 → 100: derrota imediata, ganho registrado, eventos restantes descartados', () => {
    const r = resolveNight(night({ '1,1': 'candle', '0,1': 'book', '1,2': 'skull' }, { curse: 92 }));
    expect(r.outcome).toBe('curse_defeat');
    expect(r.curse).toBe(100);
    expect(r.gain).toBe(36); // livro com +100%; crânio não chega a ativar
    expect(r.events.at(-1)).toMatchObject({ type: 'END_NIGHT', outcome: 'curse_defeat' });
  });

  it('maldição nunca passa de 100', () => {
    expect(resolveNight(night({ '0,0': 'candle', '0,1': 'book' }, { curse: 99 })).curse).toBe(100);
  });
});

describe('limites e pureza', () => {
  it('limite de ativações: excesso marca truncamento (defeito de design)', () => {
    const r = resolveNight(night({ '0,0': 'coin', '0,1': 'coin', '0,2': 'coin' }, { maxEvents: 2 }));
    expect(r.outcome).toBe('truncated');
    expect(r.gain).toBe(8);
  });

  it('a bancada cheia de 25 relíquias nunca chega perto de 256 ativações', () => {
    const layout: Record<string, 'candle' | 'skull' | 'thread'> = {};
    for (let i = 0; i < 25; i++) layout[`${Math.floor(i / 5)},${i % 5}`] = i % 2 ? 'skull' : i % 3 ? 'thread' : 'candle';
    const r = resolveNight(night(layout));
    expect(r.outcome).toBe('complete');
    expect(r.events.filter((e) => e.type === 'ACTIVATE').length).toBeLessThanOrEqual(25);
  });

  it('teto de saldo: exceder não trunca em silêncio, encerra com balance_overflow', () => {
    const r = resolveNight(night({ '0,0': 'coin', '0,1': 'coin' }, { maxBalance: 5 }));
    expect(r.outcome).toBe('balance_overflow');
    expect(r.gain).toBe(4);
    const near = resolveNight(night({ '0,0': 'coin' }, { maxBalance: 1_000_000_000, balance: 999_999_997 }));
    expect(near.outcome).toBe('balance_overflow');
  });

  it('não muta a entrada e é determinístico', () => {
    const n = night({ '2,2': 'candle', '1,2': 'ring', '0,2': 'skull', '2,3': 'skull' });
    const before = JSON.stringify(n);
    const a = resolveNight(n);
    const b = resolveNight(n);
    expect(JSON.stringify(n)).toBe(before);
    expect(a).toEqual(b);
  });

  it('seq do log é monotônica a partir de 0', () => {
    const r = resolveNight(night({ '2,2': 'candle', '2,3': 'skull', '0,0': 'feather' }));
    expect(r.events.map((e) => e.seq)).toEqual(r.events.map((_, i) => i));
  });
});

/** Textos de UI por chave (pt-BR). O motor nunca contém strings de interface. */
export const ptBR = {
  'app.title': 'Grave Credit',
  'app.tagline': 'Até os mortos têm dívidas.',
  'foundation.notice':
    'Fundação técnica P1-001: grade 5×5, PRNG e fila determinística. Ainda não é o jogo jogável.',
  'foundation.seed': 'Seed de demonstração',
  'foundation.draws': 'Primeiros sorteios do fluxo de gameplay',
  'bench.label': 'Bancada 5×5 (placeholder)',
} as const;

export type StringKey = keyof typeof ptBR;
export const t = (key: StringKey): string => ptBR[key];

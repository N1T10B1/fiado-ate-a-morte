# Plano de testes — Grave Credit v0.2.0
Tarefa P0-02c (thread 09, QA) | 2026-11-27 | base: GDD, ARCHITECTURE, DECISIONS D001–D018, `src/core` do P1-001, `prototypes/sandbox-p1.html`

Este plano não aprova nem muda regras. As fixtures descrevem o comportamento das **propostas** D001–D006 tal como o protótipo as implementa; se uma decisão mudar, as fixtures que a citam no campo `decisions` mudam junto. Conflitos e perguntas estão nas seções 8 e 9, para a thread 00.

## 1. Estado
| Item | Estado | Evidência |
|---|---|---|
| Fixtures de resolução (`tests/fixtures/resolve/`) | 46 escritas à mão | todas conferem com o motor do protótipo (`node tests/fixtures/tools/check-against-prototype.mjs`) |
| Cenários de partida (`tests/fixtures/run/`) | 17 | revisados à mão; RUN-13/15/16 conferidos com o resolvedor do protótipo |
| Golden de seed (`tests/fixtures/seed/SEED-01.json`) | 2 seeds | `gameplayInitial` confere com `createStreams(hashSeedText(...))` de `src/core/rng.ts` |
| Validação estrutural (`tests/fixtures-schema.test.ts`) | no `npm test` | coerência interna de cada fixture; não roda o resolvedor |
| Execução contra `src/core` | **não existe ainda** | depende de P1-002 (resolvedor) e P1-004 (partida) |

## 2. Níveis de teste
| Nível | O que cobre | Onde | Quando |
|---|---|---|---|
| Unitário | grade, PRNG, fila (já existem, 42 testes) | `tests/{grid,rng,queue}.test.ts` | P1-001 ✓ |
| Pureza | core sem DOM, relógio, `Math.random`, storage | `tests/core-purity.test.ts`, `tsconfig.core.json` | P1-001 ✓ |
| Fixture de resolução | bancada + maldição → log, ganho, maldição, derrota | `tests/fixtures/resolve/` | P1-002/003 |
| Propriedade | determinismo, limites, não mutação (seção 6) | `tests/resolve*.test.ts` (thread 02) | P1-002 |
| Cenário de partida | compra, venda, reroll, desfazer, tributo, vitória, derrota, recompensa | `tests/fixtures/run/` | P1-004 |
| Persistência | save versionado, reload idempotente, corrupção | a definir | P1-006 |
| Simulação | estratégias aleatória, gananciosa, sinergia, conservadora | `tests/sim/` | P1-007 |
| E2E / playtest | toque, teclado, 360 px, partida completa | `docs/PLAYTEST.md` | P1-008 |

## 3. Formato das fixtures

### 3.1 Resolução (`tests/fixtures/resolve/<ID>.json`)
```json
{
  "id": "ORD-05", "category": "ordem", "title": "…", "decisions": ["D001"], "questions": ["A02"],
  "setup": { "night": 1, "curse": 0, "destroyedThisRun": 0,
             "relics": [{ "id": 1, "def": "candle", "row": 2, "col": 1 }] },
  "config": { "maxEvents": 5 },
  "expected": { "log": [{ "type": "START_NIGHT", "night": 1 }, { "type": "ACTIVATE", "sourceId": 1 }, "…"],
                "gain": 10, "curse": 0, "defeat": false, "truncated": false, "destroyed": [] },
  "notes": "…"
}
```
- `relics[].id` é o ID da instância e é escolhido de propósito fora da ordem de leitura em várias fixtures, para provar que a fila não segue o ID.
- `config` é opcional; sem ele vale `MAX_EVENTS_PER_NIGHT = 256`.
- `expected.log` traz **só tipos de `EVENT_TYPES`**, sem `seq` nem `causeSeq`. A comparação deve filtrar o log real para esses tipos e checar a ordem e os campos listados (campos extras do log real são permitidos).
- `CHANGE_CURSE.delta` é o delta **efetivo** depois do corte em 0 e 100 (QA-Q03).
- `COPY_EFFECT` traz `amount` (conflito C-02).
- `gain` é o ganho da noite (soma de `GAIN_CURRENCY`, `COPY_EFFECT` e `REPEAT_GAIN`), não o saldo.

### 3.2 Partida (`tests/fixtures/run/<ID>.json`)
`setup.state` é um estado parcial (noite, fase, saldo, maldição, relíquias, mercado com preço explícito, `rerollCost`, `nextId`); `steps[]` é uma lista de `{ action, expect }`. Ações: `newRun`, `buy {slot,row,col}`, `sell {row,col}`, `reroll`, `move {from,to}`, `undo`, `invoke`, `chooseReward {index|null}`. Uma expectativa de falha é `{ ok: false, error, stateUnchanged: true, rngUnchanged: true }`. Os códigos de erro (`insufficient_balance`, `cell_occupied`, `cell_empty`, `offer_sold`, `nothing_to_undo`, `resolution_truncated`) são **propostas** para a thread 02; `GridError` já usa `cell_occupied` e `cell_empty`.

Os preços nas ofertas vêm do protótipo e estão pendentes de D006; o teste deve injetar o mercado da fixture, não sortear.

### 3.3 Como a thread 02 consome
1. Um adaptador converte `setup.relics` em `Grid` + instâncias (`place` de `src/core/grid.ts`).
2. Roda `resolveNight` com `maxEvents` vindo de `config` (o resolvedor precisa aceitar o limite como parâmetro, ver C-06).
3. Filtra o log para `EVENT_TYPES` e compara com `toMatchObject` evento a evento, mais `gain`, `curse`, `defeat`, `truncated`, `destroyed`.
4. Uma divergência entre `src/core` e a fixture é defeito de um dos dois: registrar, não ajustar a fixture em silêncio.

## 4. Catálogo de fixtures de resolução
| ID | Verifica | Decisão / pergunta |
|---|---|---|
| ORD-01 | tutorial vela + crânio; pena entra antes da vela por estar na linha 0 | D001 |
| ORD-02 | fila inicial em ordem de leitura com IDs embaralhados; derivados no fim | D001, D002 |
| ORD-03 | vela desperta N, L, S, O, ignorando ordem de ID | D001, D002 |
| ORD-04 | vela não desperta moeda, pena nem outra vela | D001, A02 |
| ORD-05 | duas velas, um crânio: uma ativação só | D001 |
| ORD-06 | sino enfileira crânios inativos em ordem de leitura, pula os reservados | D002 |
| ORD-07 | sino sem crânio | D002 |
| ORD-08 | fio escolhe o primeiro vizinho elegível N/L/S/O e soma +2 | D002 |
| ORD-09 | fio sem alvo ainda soma +2 | D002, A04 |
| BOR-01, BOR-04 | vela nos cantos (0,0) e (4,4); diagonal não conta | D001 |
| BOR-02 | vela na borda inferior | D001 |
| BOR-03 | espelho na coluna 0 | D003 |
| COP-01 | espelho copia crânio **inativo** à esquerda | D003, A01b |
| COP-02 | espelho copia livro: 18, sem bônus abissal, sem maldição | D003, D004 |
| COP-03 | espelho não copia dente nem outro espelho | D003 |
| COP-04 | cópia não consome a ficha do olho | D003, A03 |
| COP-05 | espelho copia moeda | D003 |
| OLH-01 | olho dobra só o próximo ganho direto | D003 |
| OLH-02 | dois olhos: fichas FIFO, 20 + 20, nunca ×4 | D003 |
| OLH-03 | ficha sobrando não faz nada | D003 |
| REP-01 | ampulheta repete o ganho já dobrado (20), sem novo ×2 | D003 |
| REP-02 | ampulheta sem ganho anterior | D003 |
| REP-03 | ampulheta ignora cópia e repetição; duas ampulhetas repetem o mesmo ganho direto | D003, QA-Q05 |
| REP-04 | ampulheta repete livro com bônus abissal já aplicado (22), sem reaplicar | D003, D004 |
| DES-01 | anel destrói primeiro vizinho vivo; dente conta (4 + 3) | D001, D002, QA-Q06 |
| DES-02 | relíquia destruída enquanto reservada na fila não ativa | D001 |
| DES-03 | segundo anel fica sem alvo e não ganha | D002 |
| DES-04 | dente com 3 destruições anteriores na partida = 13 | D003 |
| MAL-00 … MAL-99 | livro em cada fronteira de faixa (seção 7) | D004, D005, D017 |
| MAL-D1 | derrota descarta o resto da fila | D004 |
| MAL-D2 | fio leva 98 a 100 | D004 |
| MAL-P1 | pena não desce de 0 | D004 |
| MAL-P2 | faixa congelada mesmo quando a pena baixa de 32 para 27 | D004, D005, A06 |
| MAL-O1 | bônus abissal antes do olho: floor(18 × 1,25) × 2 = 44 | D003, D004 |
| CMB-60 | combo de 60 do Prompt Mestre com a disposição de A01 | D001–D003, A01, A01b |
| LIM-01 | limite atingido exatamente não trunca | D004, QA-Q01 |
| LIM-02 | um item além do limite trunca | D004, QA-Q02 |

O combo de 60 é válido sob as propostas atuais, mas **depende de A01b**: se o espelho só puder copiar relíquia já ativada, CMB-60 e COP-01 caem e a cadeia precisa ser redesenhada.

## 5. Partida, mercado e economia
| ID | Verifica | Decisão |
|---|---|---|
| RUN-01 | estado inicial: 12 óbolos, vela (2,1), crânio (2,2), pena (0,4), 4 ofertas, reroll 2, tributo 10 | D006, D008 |
| RUN-02 | tutorial paga o tributo 10 exato e oferece 3 recompensas distintas | D001, D006 |
| RUN-03 | compra válida: saldo, novo ID, oferta vendida, desfazer limpo | D006 |
| RUN-04 | saldo 11 para preço 12: rejeição sem mutação e sem consumir seed | D006 |
| RUN-05 | célula ocupada: rejeição | D006, QA-Q07 |
| RUN-06 | bancada cheia: rejeição | D006 |
| RUN-07 | oferta já comprada | D006 |
| RUN-08 | venda devolve floor(preço/2), mínimo 1; vender célula vazia falha | D006 |
| RUN-09 | reroll 2 → 3 → 4, depois saldo insuficiente; consome só o fluxo gameplay | D006 |
| RUN-10 | desfazer reverte movimento; compra apaga o histórico | D009 |
| RUN-11 | pagamento exato deixa 0 e a partida segue | D004 |
| RUN-12 | falta 1 óbolo: derrota por dívida, saldo não debitado | D004 |
| RUN-13 | maldição 100 precede o pagamento | D004, QA-Q08 |
| RUN-14 | vitória na noite 5, sem recompensa | D018 |
| RUN-15 | bancada cheia: nenhuma recompensa; recusar avança e o reroll volta a 2 | D006 |
| RUN-16 | destruídas saem da bancada; `destroyedThisRun` e maldição persistem | D002, D003 |
| RUN-17 | noite truncada não paga nem grava | D004, QA-Q02 |

Tabela de venda com os preços do protótipo (pendentes D006): vela 4→2, crânio 5→2, moeda 3→1, pena 4→2, espelho 8→4, sino 7→3, fio 7→3, dente 8→4, olho 12→6, ampulheta 13→6, livro 11→5, anel 11→5. Testar também um preço configurado 1 → venda 1 (mínimo). Arbitragem: nenhuma relíquia pode ser vendida por mais do que custou, nem comprada e vendida de volta com lucro.

## 6. Seed, determinismo e prévia (testes de propriedade)
| ID | Propriedade |
|---|---|
| P-01 | Mesma bancada + maldição + `destroyedThisRun` → `resolveNight` devolve log idêntico (deep equal) em duas execuções. |
| P-02 | `resolveNight` e `applyAction` não mutam a entrada (congelar com `Object.freeze` recursivo no teste). |
| P-03 | Prévia não altera `rngState`, saldo, maldição, contadores nem fila; prévia seguida de invocação dá o mesmo log que só a invocação. |
| P-04 | Mesma seed + mesma sequência de ações + mesma `rulesVersion` → mesmo estado final e mesmo log de todas as noites. |
| P-05 | Ação inválida devolve erro e deixa estado e seed idênticos (toda falha de RUN-04…RUN-10). |
| P-06 | Para bancadas aleatórias (seed fixa do teste, 1 000 casos): saldo ≥ 0, maldição em 0–100, nenhuma relíquia ativa duas vezes, nenhum ID em duas células, nenhuma relíquia destruída ativa depois. |
| P-07 | Trocar os IDs mantendo as posições só renomeia os IDs no log (a ordem depende da posição). |
| P-08 | O fluxo cosmético nunca é lido pelo core de regras; consumir o cosmético não muda nenhum resultado. |

SEED-01 traz o golden do sorteio de mercado para `grave-credit-qa-01` e `grave-credit-qa-02` (ofertas iniciais e após um reroll, com o estado do PRNG em cada ponto). Ele é **provisório**: os pesos 60/30/10 e a ordem do catálogo são do protótipo e mudam com D006. Os vetores do PRNG em si já estão em `tests/rng.test.ts`.

## 7. Fronteiras de maldição (livro despertado por vela)
| Maldição inicial | Faixa congelada | Ganho do livro | Maldição final | Fixture |
|---|---|---|---|---|
| 0 | estável | 18 | 8 | MAL-00 |
| 29 | estável (passa a 37 sem bônus nesta noite) | 18 | 37 | MAL-29 |
| 30 | +25% | 22 | 38 | MAL-30 |
| 59 | +25% | 22 | 67 | MAL-59 |
| 60 | +50% | 27 | 68 | MAL-60 |
| 89 | +50% | 27 | 97 | MAL-89 |
| 90 | +100% | 36 | 98 | MAL-90 |
| 92 | +100% | 36 | 100, derrota | MAL-92 |
| 99 | +100% | 36 | 100, derrota (delta +1) | MAL-99 |

Bloqueio de célula (60–89) e consumo (90–99) ficam para P2 (D017) e não têm fixture aqui.

## 8. Conflitos para a thread 00
| ID | Conflito | Proposta de QA |
|---|---|---|
| C-01 | O protótipo registra `ARM` (olho preparado) e `FIZZLE` (sem efeito), que não estão em `EVENT_TYPES`. | Decidir se entram no contrato. QA recomenda incluir: o jogador precisa ver no log por que um espelho ou anel não fez nada. As fixtures já os ignoram. |
| C-02 | `COPY_EFFECT` no contrato não tem `amount`, mas a cópia credita óbolos. | Acrescentar `amount` a `COPY_EFFECT` (as fixtures exigem). A alternativa, emitir também `GAIN_CURRENCY`, faria a cópia parecer ganho direto para olho e ampulheta. |
| C-03 | `END_NIGHT` não diz se houve derrota. | Acrescentar `defeat` (ou um evento próprio). As fixtures guardam `defeat` fora do log por enquanto. |
| C-04 | O protótipo corta o saldo em 1e9 em silêncio; ARCHITECTURE manda rejeitar com erro explícito. | Seguir ARCHITECTURE no core e corrigir o protótipo. Com o catálogo P1 o teto é inalcançável; testar com saldo inicial injetado perto de 1e9. |
| C-05 | Compra em célula ocupada: o protótipo põe a relíquia na primeira célula livre; D006 exige célula vazia. | O core rejeita (`cell_occupied`); a UI pode escolher a célula antes de chamar. |
| C-06 | O limite de 256 é **inalcançável** no catálogo P1: cada instância entra na fila no máximo uma vez (≤ 25 itens) e gera no máximo 3 entradas de log, então uma noite tem no máximo 2 + 25 × 3 = 77 entradas. | O resolvedor deve aceitar `maxEvents` como parâmetro, para que LIM-01/LIM-02 testem o mecanismo com limites 5 e 4. O par 256/257 de D004 só é testável assim. |

## 9. Perguntas abertas (encaminhar à thread 01 ou ao Rafael pela 00)
| ID | Pergunta | Comportamento atual do protótipo |
|---|---|---|
| QA-Q01 | O limite conta itens de fila processados ou entradas de log? | itens de fila |
| QA-Q02 | Noite truncada volta ao estado de antes do sino? | protótipo só marca `truncated`; não há regra de commit |
| QA-Q03 | `CHANGE_CURSE` com delta 0 (pena em 0) aparece no log? O delta registrado é o efetivo ou o nominal (99 + 8)? | registra sempre, delta efetivo |
| QA-Q04 | (= A06) Faixa congelada na invocação, inclusive quando a pena baixa a maldição antes do livro (MAL-P2). | congelada |
| QA-Q05 | Duas ampulhetas repetindo o mesmo ganho direto respeita "repetição não repete repetição"? | sim, as duas repetem |
| QA-Q06 | O anel pode destruir relíquia já ativada, de início ou a vela que o despertou? | sim, qualquer vizinho vivo |
| QA-Q07 | (= C-05) Compra exige a célula escolhida vazia? | redireciona |
| QA-Q08 | Na derrota por maldição, o ganho da noite entra no saldo? Não muda o resultado, mas muda resumo e save. | entra |

Observação de design para a thread 01: como só vela e fio despertam o anel e ambos são vizinhos dele, o anel praticamente sempre tem alvo; ele só fica sem alvo quando o despertador já foi destruído (DES-03). Na ordem N/L/S/O, o anel destrói o próprio despertador se não houver outro vizinho antes.

## 10. Não executado e riscos
- Nenhuma fixture rodou contra `src/core`, porque o resolvedor não existe. A conferência foi contra o protótipo, que é uma implementação de referência das mesmas propostas, não uma prova independente das regras.
- Persistência (P1-006), simulação (P1-007) e E2E (P1-008) só têm escopo aqui; os casos detalhados vêm quando houver contrato de save.
- Se D001–D004 mudarem na revisão do Rafael, as fixtures afetadas aparecem pelo campo `decisions` e precisam ser regeradas e reconferidas.

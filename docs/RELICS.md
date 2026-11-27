# Catálogo de relíquias — Grave Credit P1
v0.3.1-proposta | 2026-11-27 | thread 01 (P0-02a) | status: **PROPOSTA** (D019–D025) até o gate P0-G

Doze relíquias, sem ampliar o catálogo. Regras gerais de fila, ganho direto, cópia, repetição e maldição em `docs/RULES.md` (citado como §). Coordenadas `(linha,coluna)` base zero; vizinhos em N, L, S, O.

## 1. Tabela de dados

Tag mecânica `abissal` é a única que muda cálculo (recebe o bônus da faixa, §3.11). Arquétipo é rótulo de família para UI, arte e futuras sinergias; não tem efeito em P1. Peso é por definição; como há 4 relíquias por raridade, a chance por sorteio é 60% comum, 30% incomum, 10% rara (cada comum 15%, cada incomum 7,5%, cada rara 2,5%).

| ID | Nome | Gatilho | Arquétipo | Tag mecânica | Raridade | Preço | Venda | Peso | Ganho-base copiável |
|---|---|---|---|---|---|---|---|---|---|
| candle | Vela funerária | INÍCIO | necromancia | — | comum | 4 | 2 | 60 | — |
| skull | Crânio sussurrante | DESPERTAR | necromancia | — | comum | 5 | 2 | 60 | 10 |
| coin | Moeda de velório | INÍCIO | — (neutra) | — | comum | 3 | 1 | 60 | 4 |
| feather | Pena angelical | INÍCIO | purificação | — | comum | 4 | 2 | 60 | — |
| mirror | Espelho partido | DESPERTAR | reflexão | — | incomum | 8 | 4 | 30 | — |
| bell | Sino dos mortos | DESPERTAR | necromancia | — | incomum | 7 | 3 | 30 | — |
| thread | Fio de mortalha | DESPERTAR | necromancia | — | incomum | 7 | 3 | 30 | — |
| tooth | Dente do devorador | DESPERTAR | devoração | — | incomum | 8 | 4 | 30 | — (dinâmico) |
| eye | Olho do abismo | DESPERTAR | abismo | — | rara | 12 | 6 | 10 | — |
| hourglass | Ampulheta invertida | DESPERTAR | temporal | — | rara | 13 | 6 | 10 | — |
| book | Livro proibido | DESPERTAR | abismo | abissal | rara | 11 | 5 | 10 | 18 |
| ring | Anel de sacrifício | DESPERTAR | devoração | — | rara | 11 | 5 | 10 | — (condicional) |

Preços dentro das faixas do GDD (comum 3–6, incomum 7–10, rara 11–16) e iguais aos do sandbox. São hipóteses de partida para a thread 08; nenhum foi validado em playtest.

## 2. Efeitos formais

Cada efeito roda na ordem listada, imediatamente, dentro da ativação (§3.5–3.6). "Despertar X" = enfileirar X se elegível (§3.7).

| ID | Efeitos, em ordem | Sem alvo / sem valor |
|---|---|---|
| candle | Para cada vizinho em N, L, S, O: despertar. | Nada; não é erro. |
| skull | Ganho direto 10. | — |
| coin | Ganho direto 4. | — |
| feather | Maldição −5 (mínimo 0). | Com maldição 0 emite `CHANGE_CURSE` com delta 0. |
| mirror | Lê a célula imediatamente a oeste `(l, c−1)`. Se tiver relíquia viva cuja definição tenha ganho-base copiável (crânio 10, moeda 4, livro 18), cópia desse valor, **qualquer que seja o estado do alvo** (inativo, reservado ou ativado). | Coluna 0, célula vazia ou definição sem ganho-base: `NO_EFFECT`. |
| bell | Percorre a bancada em ordem de leitura e desperta cada crânio elegível. | Nenhum crânio elegível: `NO_EFFECT`. |
| eye | Acrescenta uma ficha ao fim da fila de fichas (`ARM_MULTIPLIER`). A ficha dobra o próximo ganho direto da noite, de qualquer relíquia. | Ficha não usada some no fim da noite. |
| hourglass | Se já houve ganho direto nesta noite, repetição do último ganho direto (valor final, já com bônus e olho). | Nenhum ganho direto antes: `NO_EFFECT`. |
| book | Ganho direto 18 (abissal); depois maldição +8. | Se a maldição chegar a 100, derrota na hora (§4.4). |
| ring | Alvo = primeiro vizinho em N, L, S, O com relíquia viva, em qualquer estado e de qualquer definição. Destrói o alvo (`DESTROY`, +1 em destruídas na partida, sai da bancada para sempre); depois ganho direto 16. | Sem vizinho ocupado: `NO_EFFECT`, sem ganho. Ver nota 3.1. |
| tooth | Ganho direto `4 + 3 × destruídas na partida`, contando destruições anteriores nesta mesma noite. Vendas não contam. | — |
| thread | Alvo = primeiro vizinho em N, L, S, O elegível para despertar; desperta. Depois maldição +2, **mesmo sem alvo**. | Sem alvo: `NO_EFFECT`, e a maldição +2 acontece. |

## 3. Notas de design (consequências das regras)
3.1. **O anel sempre tem alvo no P1.** Só vela e fio despertam o anel (o sino desperta só crânios), e ambos são vizinhos dele. Então o anel sempre destrói algo, e destrói quem o despertou se esse for o primeiro vizinho ocupado em N, L, S, O. O ramo "sem alvo" só é testável chamando a resolução com estado sintético. É uma escolha de posicionamento, não um defeito, mas a prévia precisa destacar o alvo.
3.2. **A ordem N, L, S, O da vela decide combos.** Olho ao norte da vela e crânio ao leste: o crânio rende 20. Invertidos: rende 10 e a ficha se perde (fixtures O1/O2).
3.3. **Relíquias de INÍCIO ativam sempre antes de qualquer DESPERTAR.** Logo a moeda nunca é dobrada pelo olho, e a pena sempre reduz antes do livro somar; a faixa, porém, já está congelada (fixture P3).
3.4. **A maldição só sobe por livro (+8) e fio (+2) e só desce pela pena (−5).** Do zero, chegar a 30 exige quatro livros ou combinações equivalentes ao longo das noites.

## 4. Critérios de aceitação por relíquia
Uma relíquia está aceita em P1-002/P1-003 quando todas as fixtures dela abaixo passam com log idêntico ao esperado, a descrição em `src/ui/strings.ts` diz o mesmo que a linha da tabela 2, e o alcance mostrado na prévia corresponde às células que o efeito examina (vela/fio/anel: 4 vizinhos; espelho: célula a oeste; sino: todos os crânios).

## 5. Fixtures descritas
Formato: bancada (só as células ocupadas), maldição no sino, destruídas antes da noite → ganho da noite, maldição final, e o trecho do log que prova a regra. IDs de instância seguem a ordem em que as relíquias aparecem na coluna Bancada (a primeira é #1). Todos os resultados (ganho, maldição, destruídas, desfecho) foram conferidos em 2026-11-27 em dois motores, o do sandbox HTML e `src/core/resolve.ts` (branch do PR #6), com resultado idêntico; a thread 09 transforma estas descrições em arquivos em `tests/fixtures/`.

| ID | Prova | Bancada | Mald. / destr. | Ganho | Mald. final | Log essencial |
|---|---|---|---|---|---|---|
| T00 | Noite 1 didática | vela(2,1) crânio(2,2) pena(0,4) | 0 / 0 | 10 | 0 | pena ativa antes da vela (ordem de leitura); crânio +10 |
| A01 | **Combo 60** | crânio(0,0) espelho(0,1) sino(1,0) vela(1,1) crânio(1,2) olho(2,1) vela(3,3) fio(3,4) ampulheta(2,4) | 0 / 0 | **60** | 2 | cópia 10 (crânio 0,0 ainda inativo) → +10 → ficha → sino desperta crânio(0,0) → fio +2 → crânio +20 (olho) → repetição +20 |
| C1 | Vela desperta 4 | vela(2,2) crânios em (1,2)(2,3)(3,2)(2,1) | 0 / 0 | 40 | 0 | crânios ativam em N, L, S, O |
| C2 | Borda | vela(0,0) crânios (0,1)(1,0) | 0 / 0 | 20 | 0 | vizinhos fora da grade ignorados |
| C3 | Vela não desperta INÍCIO (A02) | vela(2,2) moeda(2,3) pena(2,1) vela(1,2) | 0 / 0 | 4 | 0 | as quatro ativam só pela fila inicial, em ordem de leitura |
| C4 | Sem duplicata | velas (2,1)(2,3), crânio(2,2) | 0 / 0 | 10 | 0 | crânio ativa uma vez, pela primeira vela |
| K1 | Crânio sozinho não ativa | crânio(2,2) | 0 / 0 | 0 | 0 | só `START_NIGHT`, `END_NIGHT` |
| M1 | Moeda | moedas (0,0)(4,4) | 0 / 0 | 8 | 0 | +4, +4 |
| P1 | Pena no mínimo | pena(0,0) | 3 / 0 | 0 | 0 | maldição 3 → 0 |
| P3 | Faixa congelada ao descer (A06) | pena(0,0) vela(2,2) livro(2,3) | 32 / 0 | 22 | 35 | pena 32→27; livro ainda recebe +25% (18+4) |
| E1 | Espelho copia alvo inativo (A01b) | vela(1,2) espelho(2,2) crânio(2,1) | 0 / 0 | 10 | 0 | `COPY_EFFECT` 10; crânio nunca ativa |
| E2 | Espelho na coluna 0 | vela(2,1) espelho(2,0) | 0 / 0 | 0 | 0 | `NO_EFFECT` |
| E3 | Espelho no livro sem bônus nem maldição | vela(1,2) espelho(2,2) livro(2,1) | 60 / 0 | 18 | 60 | cópia 18, nenhum `CHANGE_CURSE` |
| E4 | Espelho não copia dente | vela(1,2) espelho(2,2) dente(2,1) | 0 / 2 | 0 | 0 | `NO_EFFECT` |
| E5 | Espelho copia moeda já ativada | vela(1,2) espelho(2,2) moeda(2,1) | 0 / 0 | 8 | 0 | +4 moeda, cópia 4 |
| S1 | Sino sem duplicar | vela(2,2) sino(2,3) crânios (0,0)(4,4)(2,1) | 0 / 0 | 30 | 0 | crânio(2,1) já reservado pela vela; sino desperta (0,0) e (4,4) |
| S2 | Sino sem crânio | vela(2,2) sino(2,3) | 0 / 0 | 0 | 0 | `NO_EFFECT` |
| O1 | Olho antes | vela(2,2) olho(1,2) crânio(2,3) | 0 / 0 | 20 | 0 | `ARM_MULTIPLIER`; crânio 10×2 |
| O2 | Olho depois | vela(2,2) crânio(2,3) olho(2,1) | 0 / 0 | 10 | 0 | ficha não usada |
| O3 | Dois olhos, fichas em fila | vela(2,2) olhos (1,2)(2,3) sino(3,2) crânios (0,0)(0,4)(4,4) | 0 / 0 | 50 | 0 | 20, 20, 10: uma ficha por ganho, sem ×4 |
| O4 | Olho ignora cópia (A03) | vela(2,2) olho(1,2) espelho(3,2) crânio(3,1) sino(2,1) | 0 / 0 | 30 | 0 | cópia 10 não gasta ficha; crânio depois 20 |
| O5 | Olho dobra anel | vela(2,2) olho(1,2) anel(2,3) moeda(2,4) | 0 / 0 | 36 | 0 | moeda +4; anel destrói moeda, 16×2 |
| H1 | Ampulheta | vela(2,2) crânio(1,2) ampulheta(2,3) | 0 / 0 | 20 | 0 | `REPEAT_GAIN` 10 |
| H2 | Ampulheta sem ganho | vela(2,2) ampulheta(2,3) | 0 / 0 | 0 | 0 | `NO_EFFECT` |
| H3 | Duas ampulhetas | vela(2,2) crânio(1,2) ampulhetas (2,3)(3,2) | 0 / 0 | 30 | 0 | ambas repetem 10, nenhuma repete a outra |
| H4 | Ampulheta ignora cópia | vela(2,2) espelho(1,2) crânio(1,1) ampulheta(2,3) | 0 / 0 | 10 | 0 | cópia 10; ampulheta `NO_EFFECT` |
| H5 | Ampulheta repete valor dobrado | vela(2,2) olho(1,2) crânio(2,3) ampulheta(3,2) | 0 / 0 | 40 | 0 | crânio 20; repetição 20 sem novo ×2 |
| L1–L6 | Fronteiras do bônus | vela(2,2) livro(2,3) | 0 / 29 / 30 / 59 / 60 / 89 | 18 / 18 / 22 / 22 / 27 / 27 | +8 | bônus 0, 0, +4, +4, +9, +9 |
| L7 | Abismo + olho | vela(2,2) olho(1,2) livro(2,3) | 90 / 0 | 72 | 98 | (18+18)×2; bônus antes do olho |
| L8 | Livro leva a 100 (A05) | vela(2,2) livro(2,3) crânio(2,1) | 92 / 0 | — | 100 | +36 creditado, maldição 100, derrota; crânio descartado |
| L9 | Faixa congelada ao subir (A06) | vela(2,2) livro(2,3) fio(2,1) livro(2,0) | 25 / 0 | 36 | 43 | primeiro livro 25→33; segundo livro ainda sem bônus |
| A1 | Anel destrói vizinho ativado | vela(2,2) anel(2,3) moeda(2,4) | 0 / 0 | 20 | 0 | moeda +4 antes; destrói moeda; +16 |
| A2 | Anel destrói quem o despertou | vela(2,2) anel(2,3) | 0 / 0 | 16 | 0 | destrói vela; vela sai da partida |
| A3 | Anel destrói reservado | vela(1,1) anel(1,2) crânio(2,2) vela(3,2) | 0 / 0 | 16 | 0 | crânio reservado pela 2ª vela é destruído; item dele descartado sem evento |
| D1 | Dente básico | vela(2,2) dente(2,3) | 0 / 0 | 4 | 0 | 4 + 3×0 |
| D2 | Dente com histórico | vela(2,2) dente(2,3) | 0 / 3 | 13 | 0 | 4 + 3×3 |
| D3 | Dente conta destruição da mesma noite | vela(2,2) anel(2,3) crânio(1,3) dente(2,1) | 0 / 0 | 23 | 0 | anel destrói crânio, +16; dente 4+3×1 |
| F1 | Fio desperta | vela(2,1) fio(2,2) crânio(2,3) | 0 / 0 | 10 | 2 | maldição +2 antes do crânio ativar |
| F2 | Fio sem alvo (A04) | vela(2,1) fio(2,2) | 0 / 0 | 0 | 2 | `NO_EFFECT`, depois +2 |
| F3 | Fio leva a 100 | vela(2,1) fio(2,2) crânio(2,3) | 98 / 0 | — | 100 | derrota; crânio enfileirado é descartado |
| X1 | Limite 256/257 | estado sintético com `maxEvents` injetado | — | — | — | N ativações processam; a N+1ª gera `outcome: truncated`, sem crédito |

## 6. Divergências conhecidas com o código
Sem divergência de resultado entre este texto, `src/core/resolve.ts` e o sandbox. O teto de saldo segue D026 (rejeita, não trunca).

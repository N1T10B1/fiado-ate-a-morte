# Regras formais — Grave Credit P1
v0.3.1-proposta | 2026-11-27 | thread 01 (P0-02a) | status: **PROPOSTA** até o gate P0-G

Este documento é a especificação normativa do P1. Onde ele e o GDD divergirem, vale este texto depois de aprovado; até lá, tudo aqui é proposta (D019–D025 em `docs/DECISIONS.md`; D019–D021 já implementadas como hipótese em `src/core`). Já aprovados e incorporados: D014 (nome), D017 (maldição só bônus e derrota) e D018 (quinta noite com tributo normal). O catálogo com efeitos, critérios de aceitação e fixtures está em `docs/RELICS.md`.

Convenções: "deve" é obrigatório; números são inteiros; coordenadas `(linha, coluna)` base zero, `0..4`; `(0,0)` é o canto superior esquerdo. Direções na ordem fixa **N, L, S, O** (norte `(-1,0)`, leste `(0,+1)`, sul `(+1,0)`, oeste `(0,-1)`). "Ordem de leitura" é linha crescente, depois coluna crescente.

## 1. Partida
1.1. Uma partida tem 5 noites com tributos `[10, 22, 40, 65, 100]`.
1.2. Estado inicial: saldo 12 óbolos, maldição 0, destruídas na partida 0, noite 1. Bancada 5×5 inteira aberta, com vela em `(2,1)`, crânio em `(2,2)` e pena em `(0,4)` (disposição didática: a primeira noite rende +10 sem nenhuma ação).
1.3. Cada noite percorre as fases, nesta ordem: **ORGANIZAR** (mercado, compra, venda, renovação, movimentos, prévia) → **RESOLVER** (toque do sino) → **PAGAR** → **RECOMPENSA** (noites 1–4) → próxima noite. Na noite 5, PAGAR com sucesso encerra em **VITÓRIA** (D018), sem recompensa.
1.4. Saldo, maldição, relíquias na bancada e contador de destruídas persistem entre noites. Fichas do olho, último ganho direto e reservas valem só dentro de uma resolução.
1.5. Derrota acontece em dois casos, e só neles: maldição chega a 100 durante a resolução (§4.4) ou saldo menor que o tributo em PAGAR (§5.2). Não há empréstimo, ressurreição nem segunda chance.

## 2. Bancada e organização
2.1. Cada célula tem no máximo uma relíquia; cada relíquia ocupa uma célula. Instâncias têm ID inteiro único, crescente, nunca reutilizado na partida; o ID não muda ao mover.
2.2. Em ORGANIZAR o jogador pode, sem custo e quantas vezes quiser: mover uma relíquia para célula vazia ou trocar duas relíquias de lugar.
2.3. Desfazer (D009): desfaz apenas movimentos e trocas feitos desde a última compra, venda ou renovação. Compra, venda, renovação e o toque do sino limpam o histórico. Desfazer nunca devolve óbolos nem relíquias.
2.4. A prévia (§6) está sempre disponível em ORGANIZAR e não muda estado.

## 3. Resolução de uma noite
3.1. **Instantâneo.** Ao tocar o sino, a bancada é congelada e a faixa de maldição é fixada pelo valor da maldição nesse instante (§4.2). Nenhuma edição é aceita até o fim da noite.
3.2. **Estados de uma instância na noite.** `inativa` → `reservada` (está na fila) → `ativada`; ou `destruída` a qualquer momento. Uma instância ativa no máximo uma vez por noite (não há reativadores no P1).
3.3. **Gatilhos.** Cada definição tem exatamente um gatilho: `INÍCIO` (vela, pena, moeda) ou `DESPERTAR` (as outras nove). Relíquia de DESPERTAR só ativa se algum efeito a despertar.
3.4. **Fila inicial.** Emite `START_NIGHT`; depois todas as relíquias de INÍCIO entram na fila em ordem de leitura e ficam `reservadas`.
3.5. **Laço.** Enquanto a fila não estiver vazia e não houver derrota: retira o primeiro item. Se a instância estiver destruída ou já ativada, o item é descartado **sem evento no log**. Senão, marca `ativada`, emite `ACTIVATE` e executa os efeitos da definição **imediatamente, na ordem em que estão escritos**.
3.6. **Só ativações vão para a fila.** Ganhos, maldição, cópias, repetições e destruições são aplicados na hora, dentro da ativação que os causou. Despertar alguém apenas coloca essa instância no fim da fila.
3.7. **Despertar elegível.** Um efeito de despertar só enfileira uma instância que esteja viva, `inativa` (nem reservada, nem ativada) e com gatilho DESPERTAR. Ao enfileirar, ela fica `reservada` na hora, então uma segunda vela vizinha não a duplica. Vizinhos são examinados em N, L, S, O; buscas na bancada inteira, em ordem de leitura.
3.8. **Fim.** Quando a fila esvazia, emite `END_NIGHT`. O ganho da noite é a soma de todos os créditos (§5.1).
3.9. **Limite defensivo.** Conta-se cada ativação processada (itens descartados não contam, D019). Se for preciso processar a 257ª, a resolução para com erro de resolução: `END_NIGHT` com `outcome: 'truncated'`, nada é creditado nem pago, e a noite não é confirmada. Isso é sempre defeito, nunca regra de jogo. Com o catálogo P1 o limite é inalcançável: cada instância entra na fila no máximo uma vez por noite (§3.7), então há no máximo 25 ativações. O teste de 256/257 usa o parâmetro `maxEvents` da resolução.
3.10. **Ganho direto, cópia e repetição.** Há três formas de creditar óbolos, e só a primeira interage com bônus e olho:
- **Ganho direto** (`GAIN_CURRENCY`): produzido pelo próprio efeito da relíquia (crânio, moeda, livro, anel, dente). Recebe o bônus abissal se a relíquia tiver a tag mecânica `abissal`, depois o dobro do olho, e passa a ser o "último ganho direto".
- **Cópia** (`COPY_EFFECT`, espelho): credita o ganho-base estático de outra definição. Sem bônus, sem olho, não vira "último ganho direto", não aplica maldição.
- **Repetição** (`REPEAT_GAIN`, ampulheta): credita de novo o último ganho direto, com o valor já calculado. Sem novo bônus, sem olho, não vira "último ganho direto" (repetir não repete repetição).
3.11. **Cálculo do ganho direto.** `valor = base + floor(base × bônus da faixa)` se `abissal`, senão `valor = base`; depois, se houver ficha de olho na fila de fichas, retira a primeira e `valor = valor × 2`. Uma ficha por ganho; fichas não se somam num mesmo ganho. Implementar o bônus com inteiros (`floor(base × n / d)`), sem ponto flutuante.
3.12. **Sem efeito.** Quando um efeito não encontra alvo ou valor, a ativação acontece e o log registra `NO_EFFECT` com o motivo (D019). Um efeito sem alvo não impede os efeitos seguintes da mesma definição (ex.: fio sem alvo ainda soma maldição).

## 4. Maldição
4.1. Inteiro de 0 a 100. Só muda por efeitos de relíquia; não cai sozinha. Reduções param em 0; aumentos param em 100.
4.2. Faixa, fixada no instante do sino e válida para a noite toda (A06), mesmo que a maldição mude durante a resolução:

| Maldição no sino | Faixa | Bônus abissal |
|---|---|---|
| 0–29 | estável | 0 |
| 30–59 | inquietação | +25% |
| 60–89 | tormenta | +50% |
| 90–99 | abismo | +100% |

4.3. Em P1 a faixa só altera o bônus abissal (D017). Bloqueio de célula (60–89) e consumo de relíquia (90–99) ficam para P2; a UI não deve anunciá-los no P1.
4.4. **Derrota em 100.** Toda alteração emite `CHANGE_CURSE`. Se a maldição chegar a 100, a partida termina em derrota: ao fim dessa ativação (maldição é sempre o último efeito de livro e fio, então nada mais acontece), o restante da fila é descartado, emite `END_NIGHT` com `outcome: 'curse_defeat'`, e não há pagamento. Ganhos creditados antes nessa noite não salvam a partida (A05).

## 5. Economia
5.1. Óbolos são inteiros não negativos. O saldo só muda por: ganho da noite (somado ao saldo depois da resolução, se não houve derrota nem erro), compra, venda, renovação, tributo. Teto 1.000.000.000. Inalcançável em P1. O código atual satura no teto; a ARCHITECTURE pede rejeição com erro. A diferença não muda nenhuma partida real e fica para P1-006.
5.2. **Pagar.** Após a resolução, `saldo = saldo + ganho`. Se `saldo ≥ tributo da noite`, paga (`saldo − tributo`, pode ficar 0) e segue; senão, derrota. Sobra passa para a noite seguinte.
5.3. **Mercado.** No início de ORGANIZAR de cada noite (inclusive a 1) são sorteadas 4 ofertas, com reposição (a mesma definição pode aparecer em mais de um espaço), pelo peso de cada definição (`docs/RELICS.md`, tabela 1), usando o fluxo de PRNG de jogo. Cada espaço vende uma instância só uma vez.
5.4. **Comprar.** Exige `saldo ≥ preço` e uma célula vazia, que o jogador escolhe (padrão: a primeira vazia em ordem de leitura). A operação é atômica: debita, cria instância com novo ID, ocupa a célula, marca o espaço como vendido. Se faltar saldo ou célula, nada muda.
5.5. **Vender.** Em ORGANIZAR, qualquer relíquia da bancada (iniciais e recompensas inclusive) pode ser vendida por `max(1, floor(preço / 2))`. A instância sai da partida e **não** conta como destruída. Como a venda paga no máximo metade do preço, comprar e revender nunca dá lucro.
5.6. **Renovar.** Custa 2 na primeira vez da noite e +1 a cada uso seguinte (2, 3, 4…); volta a 2 na noite seguinte. Exige saldo. Sorteia de novo os 4 espaços, inclusive os já vendidos.
5.7. **Recompensa (noites 1–4).** Após pagar, se houver ao menos uma célula vazia, sorteiam-se 3 definições **distintas** pelos mesmos pesos, sem reposição. O jogador escolhe uma (entra grátis na primeira célula vazia em ordem de leitura e pode ser movida depois) ou recusa. Se a bancada estiver cheia, não há oferta e a tela diz o porquê (A07). Recusar é sempre possível. Sem recompensa na noite 5.
5.8. PRNG: um único fluxo de jogo por partida (D013) consumido, nesta ordem, por mercado inicial, renovações e recompensas. Resolução e prévia não consomem PRNG.

## 6. Prévia
6.1. A prévia roda a mesma função de resolução sobre uma cópia do estado e mostra: ganho total, maldição final, saldo depois do tributo (ou derrota), relíquias que seriam destruídas e o log.
6.2. Como a resolução não tem aleatoriedade no P1, a prévia é exata. Ela não altera saldo, maldição, IDs, contadores, histórico de desfazer nem estado do PRNG.

## 7. Log de resolução
7.1. Cada evento tem `seq` crescente a partir de 0 e, quando aplicável, `sourceId`, `targetId`, `amount`, `delta`; `ACTIVATE` traz `byId` (quem despertou, ou nulo na fila inicial). O renderizador só reproduz o log.
7.2. Ordem obrigatória por ativação: `ACTIVATE`, depois os eventos dos efeitos na ordem da definição. Despertar não emite evento próprio; o `ACTIVATE` do despertado traz `byId`.
7.3. Tipos de `src/core/events.ts` (D019): os oito do mestre mais `ARM_MULTIPLIER` (olho prepara ficha) e `NO_EFFECT` (efeito sem alvo/valor, com motivo); `END_NIGHT` traz `outcome: 'complete' | 'curse_defeat' | 'truncated'`.

## 8. Invariantes testáveis
- Mesma seed, mesmas ações e mesma versão de regras produzem o mesmo estado e o mesmo log.
- Nenhuma instância ativa duas vezes numa noite; nenhuma destruída ativa depois de destruída.
- Saldo nunca negativo; maldição sempre em 0..100; nenhuma célula com duas relíquias.
- Prévia seguida do sino com a mesma bancada produz log idêntico.
- Velocidade de animação, pular animação e recarregar antes do sino não mudam o resultado.

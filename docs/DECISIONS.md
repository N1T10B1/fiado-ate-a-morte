# Registro de decisões — v0.3.0
D001–D009: abertura v0.1.0, todas PROPOSTA. D010–D016: v0.2.0. Status: APROVADA (diretor), PROPOSTA, HIPÓTESE (detalhe técnico reversível decidido pela coordenação) ou PENDENTE DIRETOR.

Na abertura v0.1.0 nenhuma decisão nova de gameplay foi aprovada explicitamente. Baseline herdada: Prompt Mestre v0.1 e mandato de iniciar P0. As propostas abaixo exigem revisão do diretor e threads 01/02/09. Status de todas: PROPOSTA.

| ID | Questão | Proposta para P1 | Evidência/critério |
|---|---|---|---|
| D001 | Gatilhos e duplicação | START apenas candle/feather/coin; despertar só trigger awake; reservar ativação ao enfileirar, evitar duplicatas; revalidar vivo na execução; sem reativadores no catálogo inicial | duas velas não duplicam skull; morto não ativa |
| D002 | FIFO e momento dos efeitos | processar ACTIVATE enfileirando efeitos em ordem da definição; bell percorre crânios em row/col/ID; ring escolhe alvo no DESTROY, gera moeda somente em sucesso; thread escolhe no evento de despertar e aplica +2 mesmo sem alvo (a confirmar) | log esperado, casos alvo desaparecido e sem alvo |
| D003 | Ganhos e cópia | mirror lê ganho-base estático de skull/coin/book, não gera maldição do livro nem copia tooth dinâmico/ring condicional; eye exclui a própria origem, cópia e repetição; olhos acumulam tokens FIFO, um token por ganho, sem multiplicadores empilhados; hourglass usa último ganho direto efetivamente creditado, incluindo bônus já aplicados, sem reaplicar | fixtures de ganho direto/cópia/repetição, ordem e múltiplos olhos; validar impacto |
| D004 | Ganho vs maldição e limites | efeitos book na ordem ganho depois maldição, derrota imediata ao processar 100; cap 256 eventos processados por noite, se houver 257º marcar erro de resolução sem pagamento/commit; saldo teto 1e9; bônus abyss floor(base × fator) antes de eye | fixtures 256/257, 99→100, overflow, 29/30 e demais faixas |
| D005 | Penalidades por faixa | congelar faixa no começo; implementar bônus e derrota primeiro; avaliar bloqueio/consumo antes de P2, com autorização explícita de adiamento; tag abyss candidata apenas book inicialmente | fronteiras e risco/recompensa verificáveis |
| D006 | Mercado e recompensas | ofertas de instância única por slot, duplicatas de definição permitidas; compra exige célula vazia e saldo; venda remove instância; reroll reinicia por noite; recompensas candidatas três relíquias gratuitas distintas quando espaço, recusa sempre, se não houver espaço nenhuma oferta; tabela de raridade/preço/pesos a formalizar por 01/08; iniciais colocados em posições didáticas por fixture | transações atômicas, sem arbitragem, grade cheia, primeira noite compreensível |
| D007 | Última noite | mestre pede modificador especial; proposta adiar regra especial para P2, P1 quinta noite usa tributo normal e vitória após pagamento; sem recompensa final | fluxo vitória testável; diretor decide se prefere modificador simples já em P1 |
| D008 | Contrato técnico (**parcialmente implementado em P1-001**, ver D013) | coordenadas base zero, ID sequencial, xorshift32 com seed zero normalizada, streams separados, estado/log tipado, checkpoint estável; nomes conforme arquitetura | vetor PRNG, mesmas ações/seed, nenhuma dependência de DOM |
| D009 | Undo e fronteiras | undo apenas posicionamentos desde última compra/venda/reroll, limpar histórico em transação e invocação; pagamento/recompensa idempotentes; reset preserva configurações | testes de duplicação e reload |

Pontos de revisão: D002/D003 precisam de fixture real do combo 60; se impossível, documentar e propor cadeia alternativa sem falsear resultado. D005 e D007 são adiamentos de escopo, não decisões tomadas. A tabela de preços/tags/pesos deve estar aprovada antes do gate. Nenhum número de sucesso de playtest foi medido. Nome comercial ainda não verificado.

## v0.2.0 — 2026-11-27

| ID | Status | Decisão | Origem / evidência |
|---|---|---|---|
| D010 | APROVADA | Nome do jogo passa a ser **Grave Credit** em docs, código e título. "Fiado até a Morte" vira título de trabalho histórico. Repositório não é renomeado. Verificação comercial/marca ainda pendente antes de publicar. | Rafael, 2026-11-27 |
| D011 | APROVADA | Claude (Claude Code) é o implementador principal; Codex deixa de ser dependência. ChatGPT gera as imagens finais a partir de pedidos em `docs/ASSET_REQUESTS.md`. | Prompt Mestre Claude 1.0 enviado por Rafael |
| D012 | APROVADA | P1-001 (fundação: grade, PRNG, fila) executado antes do gate P0, pois não depende de D001–D009. Resolvedor de relíquias (P1-002) segue aguardando D001–D004. | Pedido do Rafael para iniciar implementação |
| D013 | HIPÓTESE | PRNG xorshift32 (13/17/5), estado `{s: uint32}`; seed 0 (mod 2³²) → 0x9E3779B9; seed textual por FNV-1a 32 sobre UTF-8; fluxos gameplay/cosmético derivados por mistura splitmix32 com sal 1/2; inteiros por rejeição sem viés. Coordenadas base zero `{row,col}`; IDs inteiros ≥ 0. Grade imutável, operações devolvem `Result`. `swap` aceita uma célula vazia; `move` exige destino vazio. | `tests/rng.test.ts`, `tests/grid.test.ts` |
| D014 | APROVADA | Só **Grave Credit** em todos os idiomas, inclusive pt-BR. "Fiado até a Morte" fica apenas como histórico. | Rafael, 2026-11-27 |
| D015 | HIPÓTESE | Toolchain: Node ≥ 22.12, Vite 8.4.0, Vitest 5.1.2, TypeScript 5.9.3 (não a 7.x, por estabilidade), versões exatas no lockfile. `tsconfig.core.json` sem lib DOM impede DOM no core em tempo de compilação. | `npm run typecheck` |
| D016 | HIPÓTESE | Branch de trabalho do ambiente Claude: `claude/<thread>`; prefixos feature/fix/art/docs continuam valendo para threads manuais. | Restrição do ambiente |

| D017 | APROVADA | D005 (escopo): em P1, maldição implementa só os bônus por faixa e a derrota em 100; bloqueio de célula (60–89) e consumo de relíquia (90–99) ficam para P2. | Rafael, 2026-11-27 |
| D018 | APROVADA | D007 (escopo): em P1, a quinta noite usa tributo normal (100), vitória após o pagamento, sem modificador especial e sem recompensa final. Modificador da última noite volta em P2. | Rafael, 2026-11-27 |

## v0.3.0 — 2026-11-27 (P1-002 a P1-005)
Implementação seguiu as propostas D001–D004/D006/D009 como hipóteses; os pontos abaixo são as escolhas concretas feitas no código. Todas HIPÓTESE até revisão das threads 01/09.

| ID | Status | Decisão | Evidência |
|---|---|---|---|
| D019 | HIPÓTESE | Log ganha dois tipos informativos: `ARM_MULTIPLIER` (olho preparado) e `NO_EFFECT` (relíquia ativou sem alvo). O limite de 256 conta ativações processadas, não linhas do log; ao exceder, a noite termina com `outcome: truncated`. | `src/core/events.ts`, `tests/resolve.test.ts` |
| D020 | HIPÓTESE | Espelho copia o ganho-base estático (crânio 10, moeda 4, livro 18) da célula à esquerda mesmo que ela não tenha ativado; não copia maldição nem bônus, não consome olho. Ampulheta repete o último ganho **direto** creditado já com bônus e olho. Anel escolhe o primeiro vizinho vivo N/E/S/O, inclusive relíquia já ativada. Dente conta destruídas da partida inteira, incluindo as desta noite. Bônus abissal só no livro. | fixtures em `tests/resolve.test.ts` |
| D021 | HIPÓTESE | Compra vai para a célula vazia escolhida ou a primeira livre em ordem de leitura; recompensa escolhida vai para a primeira livre. Desfazer cobre só movimentos desde a última compra, venda, renovação ou noite. Venda credita `max(1, floor(preço/2))`. Preços: comuns 3–5, incomuns 7–8, raras 11–13; pesos 60/30/10. | `src/core/run.ts`, `src/core/relics.ts` |
| A08 | PARA 01 | Achado de design: no P1 o Anel sempre destrói quem o despertou (vela ou fio), porque é sempre um vizinho vivo; o caso "sem alvo" é inalcançável. Na prática o Anel come a sua vela, que some para as noites seguintes. Pode ser intencional (sacrifício) ou pedir regra "não destrói relíquia de início". Mudança de mecânica: decisão do Rafael via thread 01. | `tests/resolve.test.ts` ("anel sempre tem alvo") |

## v0.3.1-proposta — 2026-11-27 (thread 01, P0-02a)
Formalização em `docs/RULES.md` e `docs/RELICS.md`. Confirma D019–D021 acima (as 40 fixtures de RELICS dão o mesmo resultado em `src/core/resolve.ts` e no sandbox) e acrescenta só o que faltava. A numeração pode ser ajustada pela 00.

| ID | Status | Proposta | Evidência |
|---|---|---|---|
| D022 | PROPOSTA | Resolução: só ativações entram na fila; os efeitos de uma ativação são aplicados na hora, na ordem da definição. Item de instância destruída ou já ativada é descartado sem evento e não conta no limite (D019). Com o catálogo P1 cada instância entra na fila no máximo uma vez, então o limite de 256 é inalcançável e o teste usa `maxEvents` injetado. Derrota por maldição é verificada ao fim da ativação; como maldição é sempre o último efeito de livro e fio, isso equivale a "na hora". | RULES §3, §4.4; fixtures C4, S1, A3, L8, F3 |
| D023 | PROPOSTA | Tag mecânica `abissal` só no livro; arquétipos (necromancia, reflexão, abismo, purificação, devoração, temporal; moeda neutra) são rótulos sem efeito em P1. Preços e pesos conforme D021. | RELICS tabela 1 |
| D024 | PROPOSTA | Mercado: 4 ofertas por noite, com reposição; renovação 2, 3, 4… re-sorteia os 4 espaços e volta a 2 na noite seguinte. Venda de qualquer relíquia, inclusive iniciais e recompensas; venda não conta como destruída. Recompensa: 3 definições distintas, sem reposição, só se houver célula vazia; bancada cheia = nenhuma oferta, com explicação (A07). PRNG consumido só por mercado, renovação e recompensa. | RULES §5 |
| D025 | PENDENTE DIRETOR (A08) | Anel: alvo = primeiro vizinho ocupado em N/L/S/O, de qualquer definição e estado (D020). Correção do achado A08: o anel nem sempre destrói quem o despertou; ele sempre **tem** alvo no P1, e só come a vela ou o fio se não houver outra relíquia antes na ordem N/L/S/O (RELICS A1 x A2). Proposta da 01: manter assim no P1 (o jogador protege a vela pondo uma relíquia barata antes dela) e reavaliar no playtest. Alternativa: anel ignora relíquias de INÍCIO. | RELICS nota 3.1, fixtures A1–A3 |

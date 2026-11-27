# Tarefas e threads — v0.2.0
Substitui `tasks/THREADS.md` e `tasks/CODEX-001.md` (mantidos como histórico). Cada tarefa: dono, dependência, arquivos, aceitação. Estado atual resumido em `docs/STATE.md`.

## Quadro
| ID | Dono | Estado | Depende de | Arquivos | Aceitação |
|---|---|---|---|---|---|
| P0-01 | 00 | feito | — | docs/* | pacote inicial + reconciliação v0.2.0 |
| P0-02a | 01 | aberta | — | docs/GDD.md, docs/DECISIONS.md (só novas linhas propostas) | D001–D004/D006/D009 sem ambiguidade; tabela das 12 relíquias com gatilho, tags, raridade, preço, peso; respostas a A01–A07 do GDD |
| P0-02c | 09 | aberta | — | docs/TEST_PLAN.md, tests/fixtures/** | fixtures de entrada/log esperado para candle/skull/feather, fronteiras de maldição, 256/257 eventos, combo 60 ou alternativa |
| P0-04 | 03 | aberta | — | docs/ART_BIBLE.md | escala, luz, silhuetas, materiais, paleta, critérios da folha de referência; nenhum asset gerado |
| P0-05 | 04 | aberta | P0-04 (rascunho) | docs/ASSET_MANIFEST.json, docs/ASSET_REQUESTS.md | schema do manifesto e checklist técnico; amostra de 3–5 pedidos em rascunho, status "não enviado" |
| P0-06 | 05 | aberta | — | docs/UX.md | wireframes texto/ASCII ou SVG para 360 px e desktop, estados, fluxo toque/teclado, prévia e log |
| P0-07a | 06 | aberta | — | docs/AUDIO_BIBLE.md | mapa evento→som usando `EVENT_TYPES` de `src/core/events.ts`, presets ZzFX/Web Audio propostos, mixer e testes |
| P0-07b | 07 | aberta | — | docs/NARRATIVE.md, src/ui/strings.ts (só chaves novas) | tom, glossário, textos mínimos (tributo, sino, vitória, derrota) em pt-BR com chaves i18n |
| P0-08 | 08 | aberta | — | docs/BALANCE.md | hipóteses de economia/pesos, plano de simulação (estratégias aleatória, gananciosa, sinergia, conservadora), métricas; nenhum resultado inventado |
| P0-G | 00 + Rafael | aberta | P0-02a, P0-02c | docs/DECISIONS.md | contratos D001–D009 aprovados ou substituídos |
| P1-001 | 02 (Claude) | **feito, PR aberto** | D012 | package.json, tsconfig*.json, vite.config.ts, index.html, src/main.ts, src/ui/strings.ts, src/core/*, tests/* | `npm ci`, typecheck, 42 testes e build verdes |
| P1-002 | 02 | aguardando | P1-001 merge, D001–D004 | src/core/resolve.ts, src/content/relics.ts, tests/resolve*.test.ts | resolvedor FIFO com log, candle/skull/feather, limite 256, prévia sem mutação nem consumo de seed |
| P1-003 | 02 + 01/09 | aguardando | P1-002 | src/content/*, tests/* | 9 relíquias restantes; fixture do combo 60 válida ou alternativa documentada (ver A01) |
| P1-004 | 02 + 08 | aguardando | P1-003 | src/core/{run,market,economy,curse}.ts | mercado, tributo, maldição, recompensas, 5 noites, vitória/derrota, sem duplicação |
| P1-005 | 02 + 05 | aguardando | P1-002, P0-06 | src/ui/** | UI placeholder jogável, toque/teclado, prévia, log, velocidades |
| P1-006 | 02 + 09 | aguardando | P1-004 | src/persistence/** | save versionado, reload idempotente |
| P1-007 | 08 + 09 | aguardando | P1-004 | tests/sim/** | simulações por seed e relatório real |
| P1-008 | 09 + Rafael | aguardando | P1-005/006/007 | docs/PLAYTEST.md | playtest e E2E conforme ambiente |

## Paralelismo agora
Podem rodar ao mesmo tempo, em arquivos exclusivos: 01, 03, 05, 06, 07, 08, 09 (todas em docs próprios). 04 começa depois de um rascunho da 03. 02 segue em P1-002 assim que 01/09 fecharem D001–D004. Só a 02 altera `src/core/`; só a 00 altera STATE, TASKS e o status das decisões.

## Mensagens de inicialização (threads 01–09)
Base comum a todas: "Projeto Grave Credit, repositório N1T10B1/fiado-ate-a-morte. Leia primeiro `CLAUDE.md` e `docs/STATE.md`. Trabalhe só nos arquivos da sua tarefa em `docs/TASKS.md`, numa branch própria, e abra PR. Não aprove decisões: proponha. Termine com o relatório de 7 campos do CLAUDE.md."

| Thread | Lê | Mensagem |
|---|---|---|
| 01 — Game design | GDD, DECISIONS, ARCHITECTURE (contratos) | "Você é a thread de game design. Execute P0-02a: formalize gatilhos, ordem de efeitos, tags, raridades, preços e pesos das 12 relíquias e responda A01–A07 (incl. A01b) do GDD. Não amplie o catálogo. Leve ao Rafael só mudanças de mecânica." |
| 02 — Programação | ARCHITECTURE, DECISIONS (D001–D004, D008, D013), código em src/core | "Você é a thread de programação. Após o merge do P1-001 e o fechamento de D001–D004, execute P1-002: resolvedor FIFO com log tipado para candle/skull/feather, limite 256 e prévia pura. Única dona de src/core." |
| 03 — Direção de arte | GDD (seção UX/arte), seção 4 do Prompt Mestre Claude | "Você é a thread de direção de arte. Execute P0-04: escreva docs/ART_BIBLE.md (escala, luz, silhuetas, materiais, paleta, folha de referência, proibições). Não gere imagens." |
| 04 — Assets | ART_BIBLE (rascunho), ASSET_REQUESTS, seção 8.1 do Prompt Mestre Claude | "Você é a thread de assets. Execute P0-05: schema de docs/ASSET_MANIFEST.json, checklist de recepção e 3–5 pedidos de amostra em rascunho no formato do ASSET_REQUESTS. Nada é enviado ao ChatGPT antes do gate P1." |
| 05 — UX | GDD, ARCHITECTURE (contratos de grade e eventos) | "Você é a thread de UX. Execute P0-06: docs/UX.md com wireframes 360 px e desktop, fluxo toque/teclado, prévia, log, estados inválidos e acessibilidade. Placeholders apenas." |
| 06 — Áudio | seção 5 do Prompt Mestre Claude, src/core/events.ts | "Você é a thread de áudio. Execute P0-07a: docs/AUDIO_BIBLE.md com mapa evento→som, presets propostos, mixer, limites de vozes e plano de testes. Sem integrar código." |
| 07 — Narrativa | GDD (base herdada), seções 2 e 3.6 do Prompt Mestre Claude, src/ui/strings.ts | "Você é a thread de narrativa. Execute P0-07b: docs/NARRATIVE.md (tom, glossário, entidade, textos mínimos) e novas chaves pt-BR. Não revele toda a mitologia." |
| 08 — Balanceamento | GDD (P1 e catálogo), DECISIONS (D004–D006) | "Você é a thread de balanceamento. Execute P0-08: docs/BALANCE.md com hipóteses de economia e pesos e o plano de simulação. Não invente taxas de vitória; simulação real só após P1-004." |
| 09 — QA | GDD (resolução e maldição), ARCHITECTURE, DECISIONS, tests/ | "Você é a thread de QA. Execute P0-02c: docs/TEST_PLAN.md e fixtures em tests/fixtures/ com entrada e log esperado. Não mude regras; aponte conflitos à 00." |

Thread 10 (marketing) só depois do gate P1.

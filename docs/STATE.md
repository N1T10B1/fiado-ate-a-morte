# Estado do projeto — v0.3.0
Data: 2026-11-27 | Fase: P1 jogável em PR (#6), aguardando playtest | Coordenação: thread 00 (Claude)

## Estado verificável
- Nome oficial do jogo: **Grave Credit** (D010, decisão do diretor em 2026-11-27). Repositório mantém o nome `fiado-ate-a-morte`.
- Referência ativa: Prompt Mestre Claude 1.0 (`FIADO_ATE_A_MORTE_Prompt_Mestre_Claude.md`, sha256 7e74bb834abb…). O mestre v0.1 original (`FIADO_ATE_A_MORTE_Prompt_Mestre.md`, f84fd2fd9fa2…) fica como histórico. Implementação agora é feita pelo Claude (D011); Codex não é mais dependência.
- P0 da v0.1.1 já estava na main (PR #1). Nada foi apagado; `tasks/THREADS.md` e `tasks/CODEX-001.md` foram substituídos por `docs/TASKS.md` e mantidos como histórico.
- **P1-001 implementado** na branch `claude/project-thread-uw8i40`: Vite 8.4 + TypeScript 5.9 estrito + Vitest 5.1; `src/core/` com grade 5×5, PRNG xorshift32 serializável, fila FIFO persistente e tipos do log. Node 22.23.5, npm 10.9.9.
- Evidência (2026-11-27): `npm ci` ok; `npm run typecheck` ok (3 configs); `npm test` 4 arquivos / 42 testes passando; `npm run build` ok (JS 3,27 kB). Página de fundação renderizada em Chromium headless a 360 px sem erros nem rolagem horizontal.
- **P1-002 a P1-005 implementados** (mesma branch/PR #6, autorizado pelo Rafael em 2026-11-27): `src/core/resolve.ts` (resolvedor FIFO das 12 relíquias), `src/core/run.ts` (partida de 5 noites: mercado, renovação, venda, desfazer, tributo, maldição, recompensas, vitória/derrota, replay), `src/core/relics.ts` e `config.ts` (dados e números em configuração), `src/ui/app.ts` (UI placeholder com prévia, log animado 1×/2×/instantâneo, toque e teclado, laboratório de combos).
- Evidência (2026-11-27): typecheck ok; **105 testes** passando (resolvedor 37, partida 20, simulação 2, núcleo 46); build ok (JS 30 kB, 11,5 kB gzip). Teste de fumaça no Chromium headless a 360 px e 1280 px: mover/desfazer, teclado, sino com animação, recompensa, noite 2 e combo 60 no laboratório; sem erros de console nem rolagem horizontal.
- Build de playtest publicado como artefato (claude.ai/artifact/NUhhmpxfiSHUzzaSo7HKow), gerado por `npm run build:single`.
- Simulação de fumaça (150 seeds cada, não é balanceamento): estratégia aleatória perde 100% (139 na noite 2); gananciosa vence 28/150 (19%), derrotas nas noites 2–5. Nenhuma derrota por maldição. Ver tests/simulation.test.ts (SIM_REPORT=1).
- **P1-006 feito**: `src/persistence/save.ts` grava a partida após cada ação aceita (fronteira estável), valida invariantes ao carregar e guarda save danificado ou de outra versão em `grave-credit.run.corrupt` antes de recomeçar. Verificado no navegador: recarregar no meio da animação do sino retoma o pós-noite sem pagar duas vezes. 117 testes no total.
- Não existe ainda: simulação com estratégias de sinergia/conservadora (P1-007), E2E Playwright versionado, áudio, arte. Nenhum asset solicitado.

## Gates
- P0-G (contratos D001–D009 e dados): aberto. P1-001 não dependia deles (D012).
- P1-G: não iniciado.

## Próxima revisão
1. Rafael: jogar o artefato de playtest e dizer o que ficou confuso ou sem graça; revisar/mesclar o PR #6.
2. Threads 01/09 conferem a semântica implementada (D001–D004, D019–D021) contra suas propostas; divergência vira decisão, não ajuste silencioso.
3. Próximo código: P1-007 (simulações de sinergia/conservadora com relatório, com a thread 08) e correções do playtest.

## Handoff incremental
Após cada integração: ID da tarefa, commit/PR, arquivos, testes, decisões, riscos e próximo ID. Histórico completo no Git e em CHANGELOG.

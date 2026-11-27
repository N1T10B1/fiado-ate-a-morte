# Estado do projeto — v0.2.0
Data: 2026-11-27 | Fase: P0 aberto, P1-001 entregue em PR | Coordenação: thread 00 (Claude)

## Estado verificável
- Nome oficial do jogo: **Grave Credit** (D010, decisão do diretor em 2026-11-27). Repositório mantém o nome `fiado-ate-a-morte`.
- Referência ativa: Prompt Mestre Claude 1.0 (`FIADO_ATE_A_MORTE_Prompt_Mestre_Claude.md`, sha256 7e74bb834abb…). O mestre v0.1 original (`FIADO_ATE_A_MORTE_Prompt_Mestre.md`, f84fd2fd9fa2…) fica como histórico. Implementação agora é feita pelo Claude (D011); Codex não é mais dependência.
- P0 da v0.1.1 já estava na main (PR #1). Nada foi apagado; `tasks/THREADS.md` e `tasks/CODEX-001.md` foram substituídos por `docs/TASKS.md` e mantidos como histórico.
- **P1-001 implementado** na branch `claude/project-thread-uw8i40`: Vite 8.4 + TypeScript 5.9 estrito + Vitest 5.1; `src/core/` com grade 5×5, PRNG xorshift32 serializável, fila FIFO persistente e tipos do log. Node 22.23.5, npm 10.9.9.
- Evidência (2026-11-27): `npm ci` ok; `npm run typecheck` ok (3 configs); `npm test` 4 arquivos / 42 testes passando; `npm run build` ok (JS 3,27 kB). Página de fundação renderizada em Chromium headless a 360 px sem erros nem rolagem horizontal.
- Não existe ainda: resolvedor de relíquias, economia, mercado, UI de jogo, saves, áudio, arte. Nenhum asset solicitado.

## Gates
- P0-G (contratos D001–D009 e dados): aberto. P1-001 não dependia deles (D012).
- P1-G: não iniciado.

## Próxima revisão
1. Rafael: revisar/mesclar o PR #6 (P1-001). D014, D017 (=D005) e D018 (=D007) aprovados em 2026-11-27.
2. Threads 01/09 fecham D001–D004 com fixtures antes de P1-002.
3. P1-002 (resolvedor: candle/skull/feather, log, prévia) começa após o merge do P1-001.

## Handoff incremental
Após cada integração: ID da tarefa, commit/PR, arquivos, testes, decisões, riscos e próximo ID. Histórico completo no Git e em CHANGELOG.

# Changelog
## v0.3.0 — 2026-11-27
- P1-002 a P1-005: resolvedor das 12 relíquias, partida completa de 5 noites e UI placeholder jogável com laboratório de combos. 105 testes, build e teste de fumaça no navegador.
- Combo 60 virou fixture. Simulação de fumaça aleatória/gananciosa. `npm run build:single` para o artefato de playtest. Sandbox HTML provisório removido.
- DECISIONS D019–D021 (hipóteses de implementação) e A08 (anel destrói o próprio despertador).
## v0.2.0 — 2026-11-27
- Nome do jogo: Grave Credit (D010). Prompt Mestre Claude 1.0 versionado; Claude substitui Codex como implementador (D011).
- P1-001 implementado: Vite 8 + TypeScript 5.9 estrito + Vitest 5; grade 5×5, PRNG xorshift32 serializável com fluxos separados, fila FIFO persistente, tipos do log; 42 testes, typecheck e build verdes.
- Novos: CLAUDE.md, docs/TASKS.md (quadro + mensagens das threads 01–09), docs/ASSET_REQUESTS.md. Atualizados: STATE, DECISIONS (D010–D018), GDD (ambiguidades A01–A07), ARCHITECTURE, README, AGENTS. tasks/* marcados como histórico.
## v0.1.1 — 2026-11-27
- GitHub conectado, repositório criado pelo diretor e branch docs/p0-bootstrap criada pela coordenação.
- Importação da documentação de P0, incluindo Prompt Mestre original; README e STATE atualizados para refletir a integração.
- Nenhuma decisão de gameplay aprovada nesta operação. Merge, gate P0 e acesso Codex pendentes. Nenhum código, build, teste de jogo, asset ou publicação.
## v0.1.0 — 2026-11-27
- Criados documentos de P0, propostas de contratos, roadmap, mensagens de threads e tarefa Codex inicial.
- Nenhuma implementação, execução de testes de jogo, arte, commit ou publicação. Gate P0 pendente.

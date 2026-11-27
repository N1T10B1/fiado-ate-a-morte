# CODEX-001 — fundação técnica
Status: tarefa preparada, não executada. Iniciar somente após gate P0 e acesso ao repo autorizado.

Objetivo único: criar o esqueleto TypeScript estrito/Vite e três primitivas puras de motor (grade, PRNG, FIFO) com testes. Leia AGENTS.md, STATE.md, ARCHITECTURE.md e decisões aprovadas pertinentes. Verifique repo e branch antes de alterar; se contrato divergente, reporte e pare nesse ponto. Branch sugerida `feature/p1-001-core-foundation`.

Arquivos permitidos: package.json, lockfile npm, tsconfig*.json, vite.config.ts (se necessário), vitest.config.ts (se necessário), index.html, .gitignore, src/main.ts, src/core/{grid,rng,queue}.ts, tests/{grid,rng,queue}.test.ts e README.md para instruções mínimas. Ajuste nomes apenas se justificado. Não modificar docs de decisão nem arquivos não relacionados. Não instalar dependências globais nem usar serviços pagos. Escolha versões compatíveis com Node disponível, registre Node/npm e preserve lockfile.

Critérios:
1. `npm ci`, `npm run typecheck`, `npm run test` (Vitest run, sem watch), `npm run build` executam; registrar stdout resumido e falhas. `npm run dev` disponível.
2. Grade 5×5 (dimensão configurável), limites, ocupação única, move/swap atômicos, vizinhos N/E/S/O nos cantos/bordas/centro; ações inválidas sem mutação. IDs não mudam ao mover.
3. PRNG aprovado com seed explícita e serializável; teste de vetor conhecido independente, reprodutibilidade, normalização de zero e retomada de estado; sem Math.random nem data real. Não implementar mercado/sampling até tarefa posterior.
4. FIFO preserva inserção, inclusive efeitos acrescentados após remoção; vazio definido e sem mutação indevida. Limite de 256 pertence ao futuro resolver, não ao tamanho da fila genérica.
5. Core não importa DOM, áudio, armazenamento ou Vite; página HTML simples indica fundação, não se apresenta como jogo completo.

Não objetivos: relíquias, gameplay completo, UI final, economia, arte, áudio, backend, publicação, PR/merge automático. Execute somente comandos pertinentes, revise git diff, reporte arquivos, testes realmente executados, limitações, próximos passos e commit/PR se autorizado. Se não puder instalar ou testar, informe motivo sem inventar evidência.

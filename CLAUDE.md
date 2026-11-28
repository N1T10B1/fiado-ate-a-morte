# Grave Credit — instruções para Claude

Jogo: **Grave Credit** (D010/D014; único nome em todos os idiomas, "Fiado até a Morte" é só histórico). Puzzle roguelite de inventário espacial, HTML5. Rafael é o diretor criativo e decide identidade, escopo e mecânica. Fonte de referência: `FIADO_ATE_A_MORTE_Prompt_Mestre_Claude.md`; o Git é a fonte oficial versionada.

## Antes de editar
- Leia `docs/STATE.md` e `docs/TASKS.md`; depois só os docs que a tarefa pede. Não releia o Prompt Mestre inteiro sem motivo.
- Propostas em `docs/DECISIONS.md` não são regras aprovadas. Mudança de regra ou número → registrar decisão, nunca ajustar em silêncio.

## Regras de código
- TypeScript estrito, Vite, Vitest. `src/core/` é puro: sem DOM, `Math.random`, relógio, áudio, storage ou imports externos (garantido por `tsconfig.core.json` e `tests/core-purity.test.ts`).
- PRNG só via `src/core/rng.ts`, estado serializável; fluxos gameplay/cosmético separados. A UI apenas apresenta estado e log.
- Strings de UI por chave em `src/ui/strings.ts` (i18n); nenhuma string de UI no core.
- Placeholders até haver asset aprovado em `docs/ASSET_MANIFEST.json`. Não desenhar arte final por código.

## Comandos
`npm ci` · `npm run typecheck` · `npm test` · `npm run build` · `npm run dev` · `npm run build:single` (arquivo único para playtest)

## Git
Uma tarefa por branch, commits pequenos, PR para a main. Não mesclar na main, forçar push, publicar ou apagar dados sem autorização do Rafael.

## Fim de tarefa
Atualize `docs/STATE.md` e `docs/TASKS.md`. Relatório: tarefa/status · alterações · arquivos · testes executados/resultados/não executados · decisões e suposições · riscos · próxima tarefa.

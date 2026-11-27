# FIADO ATÉ A MORTE — instruções de trabalho
v0.1.0 | 2026-11-27 | P0

- O usuário é diretor criativo. Thread 00 coordena; somente ela consolida decisões autorizadas. Fonte de referência: Prompt Mestre v0.1; após integração, Git é a fonte oficial versionada. Divergências devem ser reportadas, nunca resolvidas silenciosamente.
- Antes de editar, leia `docs/STATE.md` e apenas os documentos relevantes. Confira branch, arquivos existentes, dependências e critérios da tarefa. Propostas em `docs/DECISIONS.md` não são regras aprovadas.
- Preserve o escopo P1: motor puro determinístico, grade 5×5, cinco noites, 12 relíquias, mercado, tributo, maldição, vitória/derrota, seed, placeholders. Não produza arte final nem sistemas P2+.
- TypeScript estrito, Vite, Vitest; DOM separado do motor; PRNG explícito; nunca `Math.random`, relógio, DOM ou FPS no core. A UI apenas apresenta estado e log. Sem serviços pagos, segredos ou IA em runtime.
- Uma tarefa por branch; alterações pequenas, sem reformatar módulos alheios. Não editar simultaneamente o mesmo arquivo sem coordenação. Não publicar, mesclar main, fazer push forçado ou excluir dados sem autorização. Não substituir arquivos existentes sem revisar.
- Teste o comportamento alterado, build quando aplicável, revise diff. Não declare testes não executados como aprovados. Registre mudanças de regras em decisões; não ajuste números silenciosamente.
- Entregue relatório: tarefa/status; alterações efetivas; arquivos; comandos/resultados e testes não executados; decisões/suposições; riscos; próxima tarefa. Inclua commit/PR se existente. A thread 00 atualiza STATE após integração.

# Roadmap P0/P1 — v0.1.0
Status: planejamento, não execução das tarefas abaixo. Cada linha é uma unidade de trabalho. Thread 00 aceita integrações e encaminha decisões ao diretor.

| ID | Dono | Depende de | Entrega / aceitação |
|---|---|---|---|
| P0-01 | 00 | Mestre | pacote inicial, revisão do escopo (entregue, pendente aprovação) |
| P0-02a | 01 | P0-01 | formalizar D001–D007/D009 e tabela 12 relíquias, preços/tags/pesos, sem ambiguidade |
| P0-02b | 02 | P0-01 | revisar D008, tipos e contratos; sem código de regras |
| P0-02c | 09 | P0-01 | plano de fixtures e casos adversos; validar contratos com 01/02 |
| P0-03 | 02 + diretor | acesso Git | repo privado sugerido, docs importados e diff/commit verificável |
| P0-04 | 03 | P0-01 | proposta textual da bíblia visual e folha de referência; nenhuma arte em massa |
| P0-05 | 04 | P0-01 | esquema de manifesto, checklist alfa/dimensões/licença; sem geração |
| P0-06 | 05 | P0-01 | wireframes 360px e desktop, estados e interação por toque/teclado |
| P0-07 | 06 + 07 (separados) | P0-01 | áudio: mapa de eventos e presets propostos; narrativa: tom/glossário/textos mínimos; sem integração |
| P0-08 | 08 | P0-01 | plano de simulação e hipóteses de economia; sem resultados inventados |
| P0-G | 00 + diretor | P0-02a/b/c, P0-03 | aprovar contratos, dados e responsáveis; resolver conflitos; repo verificado |
| P1-01 | 02 | P0-G | CODEX-001: Vite, TS, grade, PRNG, FIFO, build/testes verdes |
| P1-02 | 02 + 09 | P1-01 | resolver candle/skull/feather; log determinístico, preview sem mutação; fixture mínima |
| P1-03 | 02 + 01/09 | P1-02 | 9 relíquias restantes, efeitos/limites, fixture 60 ou alternativa documentada |
| P1-04 | 02 + 08/09 | P1-03 | mercado e economia, maldição, tributo, recompensas, cinco noites, vitória/derrota |
| P1-05 | 02 + 05 | P1-02, contratos P1-04 | UI placeholder e log, toque/teclado, preview, velocidade e reinício; integrar após P1-04 |
| P1-06 | 02 + 09 | P1-04 | checkpoint/save mínimo e reload idempotente, preservação de configurações |
| P1-07 | 08 + 09 | P1-04 | simulações com seed e estratégias aleatória/gananciosa/sinergia/conservadora; relatório real de distribuição |
| P1-08 | 09 + diretor | P1-05/06/07 | playtest, E2E conforme ambiente, defeitos e percepção de diversão/clareza |
| P1-G | 00 + diretor | P1-08 | partida completa, sem arte final, testes determinísticos, sem duplicação; autorizar P2 só com evidência |

Paralelismo: P0-02a/b/c, 03 e 04–08 são planejáveis independentemente, mas precisam conciliar contratos; 03 depende de autorização externa. P0-G não depende de arte/áudio final. Em P1, QA escreve fixtures em arquivos exclusivos; UI pode preparar layout contra interfaces estáveis; simulações após core completo. Separar branches e evitar dois escritores no mesmo módulo. Arte em massa, finalização narrativa, áudio integrado, 24+ relíquias e marketing ficam bloqueados até os gates pertinentes.

Playtest proposto (não meta aprovada): 3–5 voluntários ou sessões do diretor, registrar duração, entendimento do combo, escolhas espaciais, derrotas explicáveis e vontade de repetir; sem tratar amostra pequena como validação estatística. Se mecânica fraca, iterar no P1 antes de ornamentar.

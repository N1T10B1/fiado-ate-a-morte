# Arquitetura — Grave Credit v0.2.0 | P0/P1-001 | revisão pendente

## Diretrizes do Prompt Mestre
TypeScript estrito + Vite + DOM/CSS responsivo; Canvas 2D só para efeitos opcionais. Vitest; Playwright quando disponível. Build estático, sem servidor, autenticação, analytics, serviços pagos ou IA em runtime. Meta 360px+, 60 FPS quando hardware permitir; não alegar Safari/iOS sem teste real. i18n por chaves desde o início.

## Módulos e dependências (proposta)
`src/core/` grade, PRNG, eventos, estado, economia, maldição, resolução pura; sem DOM/browser/time. `src/content/` definições e configuração validadas, traduções; `src/ui/` controles e leitura de estado; `src/effects/` playback do log; `src/audio/` mixer/presets; `src/persistence/` armazenamento e migração; `src/main.ts` composição. `tests/` unitários, fixtures, simulação e E2E. `public/assets/` somente recursos aprovados. UI, persistência e efeitos dependem de contratos do core, nunca o contrário.

## Implementado em P1-001 (D013)
| Arquivo | Conteúdo |
|---|---|
| `src/core/result.ts` | `Result<T,E>` para rejeições sem mutação |
| `src/core/grid.ts` | `createGrid(5)`, `place/remove/move/swap` imutáveis, `neighbors` N/E/S/O, `leftOf`, `occupiedInReadingOrder`, `findCoord` |
| `src/core/rng.ts` | xorshift32 `{s}`, `nextUint32`, `nextInt` por rejeição, `hashSeedText` (FNV-1a/UTF-8), `createStreams` gameplay/cosmético |
| `src/core/queue.ts` | FIFO persistente: `enqueue/dequeue/peek/size/toArray` |
| `src/core/events.ts` | `EVENT_TYPES`, união `GameEvent`, `MAX_EVENTS_PER_NIGHT = 256` (só tipos) |
| `src/ui/strings.ts`, `src/main.ts` | página de fundação com bancada placeholder |

Pureza: `tsconfig.core.json` compila `src/core` sem lib DOM; `tests/core-purity.test.ts` proíbe `Math.random`, relógio, DOM, storage, timers e imports fora do core.

## Contratos propostos para revisão (restante não implementado)
- Coord {row,col} inteiros base zero, 0..4; direção N/E/S/O. ID de instância estável e único, gerado por contador serializado, não por posição. Grade rejeita ocupação dupla e coordenadas inválidas. Swap atômico.
- GameState: rulesVersion, runId/seed, rngState, night, phase, balance, curse, instances, counters, market, reward, result. RelicInstance: id, defId, coord, alive, activationCount; flags e contadores próprios. RelicDef: id, nameKey, descriptionKey, trigger, tags, rarity, price, effect tipado. Sem scripts/texto interpretado em runtime.
- `neighbors(coord)`, `move/swap(state,...)`, `nextUint32(rngState) -> {value,state}`, `enqueue/dequeue(queue)` são funções independentes. `applyAction(state,action) -> {state,log,errors}` e `resolveNight(snapshot) -> {state,log,result}`; invalid action não altera estado/seed. Nomes finais podem mudar mediante revisão de contrato.
- PRNG candidato xorshift32 (estado uint32, zero normalizado a constante documentada); vetor conhecido obrigatório e mapeamento inteiro sem viés para sorteios posteriores; streams gameplay/cosméticos separados. Nenhuma ação de prévia consome seed real.
- Eventos START_NIGHT, ACTIVATE, GAIN_CURRENCY, CHANGE_CURSE, COPY_EFFECT, REPEAT_GAIN, DESTROY, END_NIGHT. Sequência monotônica, sourceId/targetId, payload tipado, causalId quando aplicável. FIFO; inicial em ordem row/col; derivados no fim; desempate ID. Log sem efeitos no mundo externo; renderer não executa regras. Guardas detalhadas D001–D004.
- Prévia usa cópia do estado, resolve exatamente quando não houver aleatoriedade oculta; não revela sorteios futuros; não altera contadores, saldo, seed ou fila real.
- Moeda inteira não negativa, limite candidato 1_000_000_000; rejeitar overflow com erro explícito, nunca truncar silenciosamente. Maldição clamp no mínimo 0; ao alcançar 100 derrota imediata e descarte do restante.
- Persistência: envelope schemaVersion/rulesVersion + checkpoint estável + ID da transação/noite. Gravar resultado/pagamento/recompensa atomicamente em uma representação; reload antes do commit resolve mesmo snapshot, depois do commit apenas restaura. Save inválido não apaga original sem consentimento; oferecer recuperação/reinício. Testar migração, idempotência e falha de gravação. Replay guarda seed, versão e ações; versão incompatível avisa.

## Ordem de implementação
P1-001 (feito): esqueleto Vite/TS + grade, RNG, FIFO genérica e testes; sem resolver relíquias ou arte. Depois resolver gatilhos e log; economia/maldição e run loop; prévia; UI; persistência; simulações e QA. P0 gate antes de iniciar P1.

## Qualidade
Mesma seed/ações/versão => mesmo estado/log; prévia e velocidade não alteram resultado; eventos limitados a 256 na resolução; testes de ordem, borda, destruição, duplicação, curse thresholds, mercado, tributo, reload e vitória. Build e testes em cada integração; E2E desktop e mobile conforme ambiente. Sem prometer resultados não executados.

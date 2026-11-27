# Grave Credit
> Até os mortos têm dívidas.

Puzzle roguelite de inventário espacial, reações em cadeia e gestão de risco. HTML5, desktop e celular.

## Estado
Pré-produção P0 com fundação técnica P1-001 (grade 5×5, PRNG, fila, testes). Ainda não é jogável. Contratos D001–D009 e números de balanceamento são propostas. Ver [estado](docs/STATE.md).

## Documentos
- [Prompt Mestre Claude 1.0](FIADO_ATE_A_MORTE_Prompt_Mestre_Claude.md) (ativo) · [Prompt Mestre v0.1](FIADO_ATE_A_MORTE_Prompt_Mestre.md) (histórico)
- [Estado](docs/STATE.md), [decisões](docs/DECISIONS.md), [roadmap](docs/ROADMAP.md)
- [GDD](docs/GDD.md), [arquitetura](docs/ARCHITECTURE.md)
- [CLAUDE.md](CLAUDE.md), [tarefas e threads](docs/TASKS.md), [pedidos de arte](docs/ASSET_REQUESTS.md), [AGENTS.md](AGENTS.md)

## Desenvolvimento
Requer Node ≥ 22.12.

```sh
npm ci
npm run dev        # servidor local
npm test           # Vitest
npm run typecheck
npm run build      # gera dist/ estático
```

## Fluxo
Claude implementa e testa em branches com PR; Rafael revisa e mescla. Arte final vem do ChatGPT via [pedidos](docs/ASSET_REQUESTS.md). Sem publicação, APIs pagas ou IA em runtime.

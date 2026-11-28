# Fila de pedidos de arte (ChatGPT Images) — v0.2.0
Status: **nenhum pedido enviado**. O protótipo P1 roda com placeholders. Pedidos só depois do gate P1 (partida completa jogável) e de uma ART_BIBLE aprovada. Primeiro lote: amostra pequena, uma relíquia por família visual, um fundo e uma peça de UI. Nunca encomendar em massa.

## Fluxo
1. Thread 04 redige o pedido abaixo com base na ART_BIBLE; status `rascunho`.
2. Rafael aprova o rascunho e cola no ChatGPT → `enviado`.
3. Rafael anexa a imagem ao projeto → thread 04 verifica dimensões, alfa real, margem, contraste, consistência, peso e nome → `aprovado` ou `correção`.
4. Originais preservados; aprovação, prompt, proveniência e variantes registrados em `docs/ASSET_MANIFEST.json`. Nada é aprovado sem inspeção do arquivo.

## Modelo de pedido
```text
ASSET ID:
Prioridade / milestone:
Arquivo esperado (caminho e extensão):
Função no jogo / estado de UI:
Dimensões-alvo, proporção, área segura e enquadramento:
Transparência alfa ou fundo opaco:
Prompt completo em português (objeto/cena, estilo, técnica, paleta HEX,
iluminação, perspectiva, composição, escala e restrições):
Referências aprovadas a anexar:
Não incluir:
Critérios técnicos e visuais de aceitação:
Fallback provisório:
```

## Fila
| Ordem | ASSET ID | Milestone | Família | Status |
|---|---|---|---|---|
| 1 | relic_candle | P2 amostra | necromancia | planejado (sem rascunho) |
| 2 | relic_mirror | P2 amostra | reflexão | planejado (sem rascunho) |
| 3 | relic_book | P2 amostra | abismo | planejado (sem rascunho) |
| 4 | bg_shop_desktop | P2 amostra | fundo 1920×1080 | planejado (sem rascunho) |
| 5 | ui_bell_button | P2 amostra | UI | planejado (sem rascunho) |

Convenções: snake_case; relíquias com fonte quadrada 1024 px e exportação 128/256 px em `public/assets/relics/`; fundos em `public/assets/backgrounds/`; nenhum texto dentro das imagens.

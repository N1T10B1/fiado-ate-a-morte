# UX e interface — Grave Credit
v0.1 | 2026-11-27 | tarefa P0-06 (thread 05) | **PROPOSTA**, nada aqui é regra aprovada

Base: GDD v0.2.0 (UX, loop P1, maldição), ARCHITECTURE (contratos de grade e eventos), D001–D009/D017/D018, seção 4 do Prompt Mestre Claude, `src/core/events.ts` e o protótipo `prototypes/sandbox-p1.html`. Este documento descreve **como a interface apresenta** as regras; não cria nem altera regra, número ou mecânica. Onde a UX depende de uma decisão aberta, isso está marcado com o ID da decisão. Tudo é placeholder: retângulos, glifos e texto. Arte final vem de `docs/ART_BIBLE.md` e `docs/ASSET_MANIFEST.json` (threads 03/04).

## 1. Princípios
1. **A bancada é o jogo.** Ela fica no centro, sempre inteira na tela, nunca coberta por painéis durante a organização.
2. **Os quatro números nunca saem da vista:** noite, óbolos, tributo e maldição (com faixa por texto). Em mobile ficam numa régua fixa no topo.
3. **Nada é surpresa.** Antes do sino o jogador vê a prévia (ganho, maldição antes→depois, saldo após tributo, destruições). Depois do sino, o livro-caixa conta o que aconteceu, na mesma ordem do log do motor.
4. **Um gesto, um resultado.** Toque/clique para selecionar e toque/clique no destino. Arrastar é atalho opcional, nunca o único caminho.
5. **Cor nunca é a única pista.** Todo estado tem ícone ou texto e, quando importa, forma ou padrão.
6. **A UI só lê estado e log** (CLAUDE.md). Prévia, alcance e mensagens de erro vêm de funções puras do core; a UI não recalcula regra.

## 2. Pontos de quebra e medidas
| Faixa | Nome | Disposição | Célula da bancada |
|---|---|---|---|
| 360–599 px | mobile | coluna única: régua → bancada → prévia → ações → painel (mercado/recompensa) → livro-caixa | 56–64 px (360 px: 336 px úteis − 2×8 padding − 4×4 gap ⇒ ≈ 60 px) |
| 600–1023 px | tablet / retrato largo | coluna única com bancada até 480 px; painel e livro-caixa lado a lado abaixo | 72–88 px |
| ≥ 1024 px | desktop | três zonas: livro-caixa à esquerda, bancada ao centro, mercado à direita | 88–104 px (bancada máx. 540 px) |

- Gutter lateral 12 px em mobile (16 px a partir de 400 px). Sem rolagem horizontal em nenhuma largura ≥ 320 px (alvo 360, tolerância 320).
- Alvo de toque mínimo **44×44 px** para qualquer controle (mais rígido que o mínimo de 24 px do WCAG 2.2 2.5.8).
- Altura: em 360×640 a bancada, a prévia e o sino cabem na primeira dobra abaixo da régua (régua ≈ 56 px + bancada ≈ 340 px + prévia ≈ 48 px + barra de ações ≈ 56 px = 500 px). Mercado e livro-caixa ficam abaixo, com rolagem vertical.
- Paisagem em celular (altura < 500 px): bancada à esquerda ocupando a altura; painel e livro-caixa em abas à direita.
- Respeitar `env(safe-area-inset-*)` na régua e na barra de ações.

## 3. Wireframes

### 3.1 Desktop (≥ 1024 px), fase de organização
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ GRAVE CREDIT        Noite 2/5 │ Óbolos 14 │ Tributo 22 │ Maldição 8 ▮▯▯▯▯ estável │ ⚙ ? │
├───────────────────────┬────────────────────────────────────┬─────────────────────────┤
│ LIVRO-CAIXA (noite 1) │            BANCADA 5×5             │ MERCADO DA MEIA-NOITE   │
│ ▸ Vela acende   (1)   │  ┌────┬────┬────┬────┬────┐         │ ┌─────────────────────┐ │
│   ↳ Crânio desperta   │  │ ☠  │ ✶① │    │    │    │         │ │ ✧ Espelho  inc. 8 ób│ │
│   ↳ Crânio  +10       │  ├────┼────┼────┼────┼────┤         │ │ copia ganho-base à  │ │
│ ▸ Pena  −5 maldição   │  │    │ ⌖  │    │    │    │         │ │ esquerda            │ │
│ ─────────────────     │  ├────┼────┼────┼────┼────┤         │ ├─────────────────────┤ │
│ Ganho +10 · Pago 10   │  │    │    │    │    │    │         │ │ ♫ Sino     inc. 9 ób│ │
│                       │  ├────┼────┼────┼────┼────┤         │ ├─────────────────────┤ │
│ [ver noite anterior]  │  │    │    │    │    │    │         │ │ ◉ Olho     rara 12  │ │
│                       │  ├────┼────┼────┼────┼────┤         │ ├─────────────────────┤ │
│                       │  │    │    │    │    │    │         │ │ ✕ Livro (sem saldo) │ │
│                       │  └────┴────┴────┴────┴────┘         │ └─────────────────────┘ │
│                       │ PRÉVIA  ganho +10 · maldição 8→3 ·  │ [Renovar ofertas 2 ób]  │
│                       │         saldo após tributo 2 ✓      │                         │
│                       │ [↶ Desfazer] [Vender +2]  [1×|2×|⏭] │ Seed: meia-noite  [⟳]  │
│                       │ ╔══════════ TOCAR O SINO ═════════╗ │                         │
└───────────────────────┴────────────────────────────────────┴─────────────────────────┘
```
Legenda: `①` ordem de início (D001: vela/pena/moeda em ordem de leitura); `⌖` célula selecionada; células de alcance com moldura tracejada e ícone de alvo (ver 6). Livro-caixa à esquerda mostra a última resolução; durante a resolução vira o painel ao vivo.

### 3.2 Mobile 360 px, organização (primeira dobra)
```
┌──────────────────────────────────┐
│ N 2/5  ób 14  trib 22  ☾ 8 est.  │ ← régua fixa (2 linhas se fonte ≥ 120%)
├──────────────────────────────────┤
│ ┌─────┬─────┬─────┬─────┬─────┐  │
│ │ ☠   │ ✶ ① │     │     │     │  │
│ ├─────┼─────┼─────┼─────┼─────┤  │
│ │     │ ⌖   │     │     │     │  │   célula ≈ 60 px
│ ├─────┼─────┼─────┼─────┼─────┤  │
│ │     │     │     │     │     │  │
│ ├─────┼─────┼─────┼─────┼─────┤  │
│ │     │     │     │     │     │  │
│ ├─────┼─────┼─────┼─────┼─────┤  │
│ │     │     │     │     │     │  │
│ └─────┴─────┴─────┴─────┴─────┘  │
│ +10 · ☾ 8→3 · sobra 2 ✓    [ⓘ]   │ ← prévia compacta; ⓘ abre detalhe
├──────────────────────────────────┤
│ [↶]  [Vender +2]  [2×]  [ SINO ] │ ← barra de ações fixa no rodapé
└──────────────────────────────────┘
```
Abaixo da dobra (rolagem):
```
│ MERCADO ───────────── [Renovar 2] │
│ ┌──────────────────────────────┐ │
│ │ ✧ Espelho   incomum   8 ób   │ │  cartões de 1 coluna, altura ≥ 64 px
│ │ Copia o ganho-base à esquerda│ │
│ └──────────────────────────────┘ │
│ … (4 ofertas)                    │
│ LIVRO-CAIXA (última noite)  [▾]  │  recolhido por padrão em mobile
```
O sino fica na barra fixa do rodapé, sempre alcançável pelo polegar. O mercado é o "painel inferior" do GDD: em mobile é uma seção da página, não uma gaveta modal, para não esconder a bancada nem prender o foco.

### 3.3 Mobile, relíquia selecionada (folha de detalhe)
```
│ ┌─ Vela funerária ─────── comum ┐ │
│ │ Início · desperta vizinhos     │ │  folha não modal, ancorada acima da
│ │ N/E/S/O inativos (D001)        │ │  barra de ações; não cobre a bancada
│ │ Alcance: 3 células, 1 alvo     │ │
│ │ [Mover]  [Vender +1]  [Fechar] │ │
│ └────────────────────────────────┘ │
```
É o "tooltip acessível por toque/foco" do mestre: mesmo conteúdo do hover no desktop.

### 3.4 Resolução (desktop e mobile)
```
┌ RESOLVENDO — noite 2 ─────── [⏭ pular] ┐
│ bancada com a fonte atual destacada (moldura dupla + rótulo "agora")      │
│ e a seta origem → destino desenhada sobre a grade                          │
│ livro-caixa ao vivo, uma linha por evento, rolagem automática             │
│ contador:  ganho +20   ☾ 3 → 5                                            │
└────────────────────────────────────────────────────────────────────────────┘
```
Em mobile o livro-caixa ao vivo aparece numa faixa de 3 linhas logo abaixo da bancada (substitui a prévia) e expande ao toque.

### 3.5 Pagamento e recompensa
```
┌ TRIBUTO PAGO ─────────────────────────┐   ┌ RECOMPENSA DO PROPRIETÁRIO ─────────┐
│ Saldo 34 − tributo 22 = 12 óbolos      │   │ Escolha uma relíquia gratuita ou     │
│ Maldição 5 (estável)                   │ → │ recuse. Ela vai para a célula vazia  │
│ [Continuar]                            │   │ que você escolher.                   │
└────────────────────────────────────────┘   │ [✧ Espelho] [♫ Sino] [◉ Olho]        │
                                             │ [Recusar e seguir]                   │
                                             └──────────────────────────────────────┘
```
Bancada cheia (D006/A07): o painel diz "A bancada está cheia: nenhuma relíquia pode ser oferecida" e mostra só "Seguir para a noite N". Quinta noite (D018): após o pagamento vai direto à vitória, sem recompensa.

### 3.6 Fim de partida
```
┌ CONTRATO CUMPRIDO ──────────────┐   ┌ A LOJA COBROU ───────────────────────┐
│ 5 noites pagas · 48 óbolos      │   │ A maldição chegou a 100 na noite 3.  │
│ maldição 41 · seed meia-noite   │   │ Evento: Livro proibido +8 (92 → 100) │
│ [Nova partida] [Mesma seed]     │   │ [Ver livro-caixa] [Tentar de novo]   │
│ [Copiar seed]                   │   │ [Nova seed]                          │
└─────────────────────────────────┘   └──────────────────────────────────────┘
```
Derrota por dívida mostra "Faltaram X óbolos para o tributo de Y". Toda derrota aponta a causa concreta (evento do log ou conta do tributo): é o pilar "derrotas compreensíveis".

## 4. Estados de tela
Máquina de fases da UI. A fase vem do `GameState.phase` (ARCHITECTURE); os subestados são só de UI.

| Estado | Entra quando | Visível | Ações habilitadas | Foco inicial | Anúncio (aria-live) |
|---|---|---|---|---|---|
| `title` | abrir o jogo | título, Continuar (se save válido), Nova partida, seed, Configurações | iniciar, continuar, configurar | botão Continuar ou Nova partida | — |
| `organize` / ocioso | início da noite ou fim da recompensa | tudo de 3.1/3.2 | selecionar, comprar, renovar, sino | primeira célula ocupada | "Noite N. Tributo Y. Saldo X." |
| `organize` / relíquia selecionada | toque/Enter numa relíquia | alcance, folha de detalhe, botões Mover/Vender | mover/trocar com toque em outra célula, vender, Esc cancela | permanece na célula | "Vela selecionada, linha 1 coluna 2. Alcança 3 células." |
| `organize` / oferta selecionada | toque numa oferta com saldo | células vazias realçadas como destino | toque em célula vazia compra e coloca; Esc cancela | primeira célula vazia | "Escolha uma célula vazia para o Espelho, 8 óbolos." |
| `organize` / ação inválida | ação rejeitada pelo core (`Result` com erro) | mensagem curta junto ao controle, estado inalterado | as mesmas de antes | volta ao controle de origem | texto do erro (seção 8) |
| `preview-detail` | ⓘ na prévia | lista do que a prévia prevê, evento a evento, marcada "prévia" | fechar | botão Fechar | — |
| `confirm-risk` | sino com prévia de derrota (maldição 100 ou saldo insuficiente) | diálogo: "A prévia indica derrota: …" | Tocar mesmo assim, Voltar | Voltar | — |
| `resolving` | sino confirmado | 3.4 | pular (vai ao fim), pausar (tecla Espaço), velocidade | botão Pular | uma linha por evento resumida (ver 7.3) |
| `payment` | fim do log sem derrota | 3.5 esquerda | continuar | Continuar | "Tributo pago. Restam X óbolos." |
| `reward` | após pagamento, noites 1–4 | 3.5 direita; bancada aceita só colocação | escolher, recusar | primeira recompensa | "Escolha uma recompensa ou recuse." |
| `reward` / bancada cheia | sem célula vazia (D006) | aviso e "Seguir" | seguir | Seguir | aviso |
| `victory` | pagamento da noite 5 (D018) | 3.6 esquerda | nova partida, mesma seed, copiar seed | Nova partida | "Contrato cumprido." |
| `defeat-curse` | evento que leva maldição a 100 (D004) | 3.6 direita com o evento causador | ver log, tentar de novo, nova seed | Ver livro-caixa | "Derrota: maldição 100." |
| `defeat-debt` | saldo < tributo após resolução | idem, com a conta | idem | idem | "Derrota: faltaram X óbolos." |
| `error-resolution` | 257º evento (D004, `END_NIGHT.truncated`) | "Erro de resolução: a noite não foi cobrada." com seed e botão copiar relatório | voltar à organização (estado pré-sino), copiar relatório | Voltar | texto do erro |
| `error-save` | save inválido/versão incompatível (ARCHITECTURE) | "Não conseguimos ler o save." Nunca apaga sem consentimento | tentar recuperar, exportar original, começar do zero (com confirmação) | Tentar recuperar | texto do erro |
| `paused` | aba oculta durante resolução ou menu aberto | resolução congelada | retomar | Retomar | — |

Regras transversais:
- Durante `resolving`, `payment` e fins de partida, bancada e mercado ficam inertes (`aria-disabled`, sem foco nos itens), como o protótipo já faz.
- Recarregar a página em `resolving` retoma a partir do snapshot estável e reapresenta o mesmo log (ARCHITECTURE, persistência); a UI mostra "Retomando a noite N" e nunca cobra duas vezes.
- Penalidades de célula bloqueada e consumo de relíquia (60–89/90–99) **não existem em P1** (D017). O espaço na UI fica reservado: a célula bloqueada terá padrão hachurado + cadeado + rótulo; o alvo de consumo, moldura vermelha tracejada + ícone e texto "será consumida". Desenho completo em P2.

## 5. Entrada

### 5.1 Toque e mouse (caminho principal)
| Gesto | Resultado |
|---|---|
| tocar relíquia | seleciona; mostra alcance e detalhe |
| tocar outra célula vazia | move (D013: `move` exige destino vazio) |
| tocar outra relíquia | troca (D013: `swap`) |
| tocar a mesma relíquia | desseleciona |
| tocar fora da bancada / Esc | cancela seleção |
| tocar oferta e depois célula vazia | compra e coloca. Se a oferta for tocada sem célula escolhida, o protótipo usa a célula selecionada ou a primeira livre; a proposta aqui é **sempre pedir a célula**, porque a posição decide o combo |
| arrastar relíquia (opcional) | mesmo que tocar origem + destino; arrasto < 8 px vira toque. Desativável em Configurações |
| pressionar longo (500 ms) | abre detalhe sem selecionar (equivale ao hover) |

Vender exige seleção e botão explícito com o valor ("Vender +2"); sem gesto de arrastar para fora, para evitar venda acidental. Vender relíquia inicial pede confirmação na noite 1.

### 5.2 Teclado
| Tecla | Ação |
|---|---|
| Tab / Shift+Tab | régua → bancada (uma parada só, *roving tabindex*) → ações → mercado → livro-caixa |
| Setas | movem o foco dentro da bancada (sem dar a volta nas bordas) |
| Enter / Espaço | selecionar / confirmar destino (igual ao toque) |
| Esc | cancelar seleção ou fechar folha/diálogo |
| M | ir ao mercado; 1–4 escolhe a oferta |
| V | vender a selecionada · Z ou Ctrl+Z desfazer posição |
| B | tocar o sino (abre `confirm-risk` se a prévia indicar derrota) |
| S | pular animação durante `resolving` · Espaço pausa/retoma |
| ? | lista de atalhos |

Atalhos de letra única só valem com o foco dentro do jogo e podem ser desligados (WCAG 2.1.4).

### 5.3 Desfazer (D009)
Botão "Desfazer posição" desfaz apenas movimentos e trocas desde a última compra, venda ou renovação. Depois dessas transações o histórico zera e o botão fica desabilitado com dica "Nada a desfazer desde a última compra". Desfazer nunca devolve óbolos.

## 6. Alcance e prévia
**Alcance** (ao selecionar ou focar): a UI pede ao core as células afetadas pela relíquia e as marca:

| Relíquia | Alcance mostrado |
|---|---|
| vela, fio, anel | N/E/S/O; vizinho elegível com ícone de alvo `◎`, vizinho não elegível (ex.: vela vizinha, D001/A02) com `⊘` e motivo no detalhe |
| espelho | célula à esquerda; se vazia, "nada a copiar" |
| sino | todos os crânios da bancada, numerados na ordem em que tocam (D002: row/col/ID) |
| olho, ampulheta | sem célula: o detalhe explica "afeta o próximo ganho direto" / "repete o último ganho" |
| crânio, livro, moeda, pena, dente | só a própria célula |

Marcas sempre com três canais: moldura (sólida = selecionada, tracejada = alcance), ícone (`◎`/`⊘`) e texto no `aria-label` ("alvo da vela").

**Ordem de início:** relíquias de início exibem o número de ordem (`①②…`) em canto fixo, por leitura linha/coluna.

**Prévia** (linha logo abaixo da bancada, atualizada a cada mudança de posição, compra ou venda):
`Prévia: ganho +G · maldição A→B (faixa) · saldo após tributo S ✓|✕ · destruídas: …`
- É exata quando não há aleatoriedade oculta (ARCHITECTURE). Se um dia houver, mostra faixa e condição ("+10 a +26, depende de …"), nunca um valor falso.
- Não consome seed nem mexe em contadores (contrato do core).
- Resultado ruim recebe ✕ e texto ("derrota", "faltam 4"), não só vermelho.
- Faixa de maldição é congelada no início da invocação (GDD, A06): se a prévia passar de faixa, ela avisa "bônus de 25% só a partir da próxima noite".
- ⓘ abre `preview-detail`: a lista completa de eventos que a prévia previu, no mesmo formato do livro-caixa, marcada "prévia".

**Linha origem → destino:** durante a resolução, e no `preview-detail` ao focar uma linha, desenha-se seta da célula fonte para a alvo (SVG sobre a grade). Com movimento reduzido, a seta aparece sem animação.

## 7. Livro-caixa (log)
### 7.1 Formato de linha por evento (`EVENT_TYPES`)
| Evento | Linha (pt-BR, placeholder) | Realce na bancada |
|---|---|---|
| `START_NIGHT` | "Noite N começa. Maldição A (faixa)." | — |
| `ACTIVATE` | "▸ {relíquia} desperta" (indentada sob a causa, via `causeSeq`) | moldura "agora" na fonte |
| `GAIN_CURRENCY` | "{relíquia} +X óbolos" (+ "(bônus abissal 25%)" quando houver) | número flutuante na célula |
| `CHANGE_CURSE` | "{relíquia} +X maldição (A→B)" ou "−X" | marcador ☾ na célula |
| `COPY_EFFECT` | "{espelho} copia {alvo}" | seta fonte→alvo |
| `REPEAT_GAIN` | "{ampulheta} repete +X" | seta fonte→origem do ganho |
| `DESTROY` | "{anel} destrói {alvo}" | alvo vira contorno vazio com ✕ e texto "destruída" |
| `END_NIGHT` | "Total +G · maldição B." (se `truncated`, estado `error-resolution`) | — |

Hierarquia por recuo segue `causeSeq`, para o jogador ver quem causou o quê. Linhas são texto real (copiável), não imagem.

### 7.2 Reprodução e velocidade
- 1× ≈ 450 ms por evento, 2× ≈ 225 ms, instantânea = tudo de uma vez. Velocidade não altera resultado (GDD, ARCHITECTURE); a UI só reproduz um log já calculado.
- "Pular" leva ao fim imediatamente. A velocidade escolhida é salva nas configurações.
- A resolução nunca bloqueia a interface: menu e pausa funcionam durante a animação.

### 7.3 Leitor de tela
Anunciar cada evento a 1× seria verborrágico. Proposta: `aria-live="polite"` anuncia um resumo a cada `ACTIVATE` de primeiro nível e o total ao fim; a lista completa fica navegável como `role="log"` após a resolução.

### 7.4 Histórico
O livro-caixa guarda as noites da partida atual ("ver noite anterior"). Em mobile, recolhido por padrão com o total à vista.

## 8. Ações inválidas e mensagens
Toda rejeição do core vira mensagem curta, ao lado do controle, sem alterar estado. Nunca só um tremor ou som.

| Situação | Mensagem placeholder |
|---|---|
| comprar sem saldo | "Faltam X óbolos." (botão já vem desabilitado com o motivo no rótulo) |
| comprar sem célula vazia | "A bancada está cheia. Venda algo primeiro." |
| renovar sem saldo | "Renovar custa X óbolos." |
| mover para fora / durante resolução | (não oferecido; controles inertes) |
| sino com bancada vazia | "Nada na bancada. O sino tocaria para ninguém." (proposta: permitir e mostrar prévia +0) |
| desfazer sem histórico | "Nada a desfazer desde a última compra." |
| vender na fase errada | (não oferecido) |

Controles desabilitados usam `aria-disabled` + motivo legível (e não só `disabled`, que tira o foco e esconde o porquê).

## 9. Tutorial de três passos
Mestre 3.6: "posicionar, observar alcance, invocar". Integrado à primeira noite da primeira partida, sem tela separada. Pertence ao gate P2; em P1 só as dicas contextuais de 9.3.

**Configuração** (D006 "iniciais em posições didáticas por fixture"; mestre: vela e crânio podem ficar adjacentes): noite 1, tributo 10, 12 óbolos, vela em (1,1), pena em (1,3), crânio em (3,1), **não adjacente** à vela. Sem o passo 1 a prévia mostra ganho 0 e "faltam 10" — o problema é visível antes da solução.

| Passo | Pede | Destaque | Conclui quando | Texto placeholder |
|---|---|---|---|---|
| 1 — Posicionar | levar o crânio para perto da vela | crânio pulsando (estático com movimento reduzido) e as 4 células vizinhas da vela tracejadas | crânio em célula N/E/S/O da vela | "O crânio só fala se alguém o acordar. Coloque-o ao lado da vela." |
| 2 — Observar alcance | selecionar a vela | alcance da vela com `◎` no crânio; prévia muda de +0 para +10 com realce | vela selecionada com o crânio no alcance | "Veja até onde a chama alcança. A prévia mostra o que vai acontecer antes de você arriscar." |
| 3 — Invocar | tocar o sino | botão do sino destacado; o resto da tela segue utilizável | fim da resolução | "Quando estiver pronto, toque o sino. O livro-caixa conta cada passo." |

Regras do tutorial:
- Nada bloqueia: o jogador pode ignorar o passo e agir livremente; o passo só avança ao cumprir a condição. Mercado fica visível mas o tutorial não fala dele antes do sino.
- "Pular tutorial" sempre visível; "Rever tutorial" em Configurações. Concluído/pulado grava preferência local.
- Texto em caixa ancorada perto do alvo (desktop) ou acima da barra de ações (mobile), nunca sobre a bancada; foco não é roubado, a caixa é anunciada por `aria-live`.
- Teste de aceitação (P2): jogador novo conclui os três passos sem ajuda e entende por que ganhou +10 (gate P2 do mestre: "compreende o primeiro combo sem assistência").

### 9.3 Dicas contextuais (P1)
Primeira vez que algo acontece, uma linha de dica no painel: primeiro mercado ("compre e escolha onde colocar"), primeira faixa de maldição 30+ ("ganhos abissais rendem mais; 100 é derrota"), primeira recompensa, primeira destruição. Uma dica por vez, dispensável.

## 10. Requisitos de acessibilidade
Meta: WCAG 2.2 AA onde aplicável a jogo. Cada requisito tem como verificar (para a thread 09 incluir no TEST_PLAN).

| ID | Requisito | Verificação |
|---|---|---|
| A11Y-01 | Todo o jogo jogável só com teclado, incluindo mercado, recompensa, diálogos e configurações | E2E Playwright sem mouse; roteiro manual |
| A11Y-02 | Foco sempre visível: contorno ≥ 2 px com contraste ≥ 3:1 contra o fundo, nunca escondido por painel fixo (WCAG 2.4.11) | inspeção + screenshot |
| A11Y-03 | Bancada como `role="grid"` com 25 `gridcell`, *roving tabindex*, `aria-label` "Linha R, coluna C: {relíquia ou vazia}{, selecionada}{, alvo da vela}{, início ordem N}" | axe + leitor de tela |
| A11Y-04 | Alvo de toque ≥ 44×44 px; espaçamento ≥ 4 px entre células | medição no E2E a 360 px |
| A11Y-05 | Nenhuma informação só por cor: faixa de maldição com texto; raridade com rótulo; alcance com ícone e moldura; erro com texto | revisão com simulação de daltonismo (protanopia, deuteranopia, tritanopia) |
| A11Y-06 | Contraste de texto ≥ 4,5:1 (≥ 3:1 para texto ≥ 24 px ou ícones). Ver 10.1 | script de contraste sobre os tokens |
| A11Y-07 | Nenhuma informação só por som (mestre seção 5); todo som tem equivalente textual no log | revisão com mudo |
| A11Y-08 | Movimento reduzido: segue `prefers-reduced-motion` e tem chave própria; sem pulsos, tremores, partículas ou zoom; transições ≤ 100 ms ou cortes | E2E com `reducedMotion: 'reduce'` |
| A11Y-09 | Nada pisca mais de 3 vezes por segundo (WCAG 2.3.1) | revisão de efeitos (thread 03/06) |
| A11Y-10 | Sem limite de tempo em decisão nenhuma; resolução pode ser pausada e pulada | roteiro manual |
| A11Y-11 | Zoom de 200% e texto 120%/150% sem perda de conteúdo nem rolagem horizontal a 360 px (WCAG 1.4.4/1.4.10/1.4.12) | E2E com escala de fonte |
| A11Y-12 | Leitor de tela: mudanças de saldo, tributo, maldição e resultado anunciadas por `aria-live="polite"`; derrota e erros por `assertive`; log navegável como `role="log"` | NVDA/VoiceOver quando houver ambiente; não alegar sem teste |
| A11Y-13 | Rótulos de botão com o efeito e o valor ("Vender +2", "Renovar ofertas, 3 óbolos"); ícones decorativos com `aria-hidden` | axe |
| A11Y-14 | Diálogos (`confirm-risk`, fim de partida, erro de save) com `role="dialog"`, foco preso enquanto abertos, Esc fecha quando seguro, foco volta ao controle de origem | E2E |
| A11Y-15 | Arrastar nunca é obrigatório (WCAG 2.5.7); pressão longa tem alternativa (botão ⓘ) | roteiro manual |
| A11Y-16 | Atalhos de letra única podem ser desligados (WCAG 2.1.4) | roteiro manual |
| A11Y-17 | Idioma declarado (`lang="pt-BR"`), textos por chave i18n (CLAUDE.md); layout tolera textos 30% maiores (en) | troca de idioma em P3 |
| A11Y-18 | Configurações acessíveis em qualquer fase: volume por bus, mudo, velocidade, movimento reduzido, arrastar, atalhos, tamanho de texto (100/120/150%), alto contraste | E2E |
| A11Y-19 | Áudio só começa após gesto do usuário e respeita mudo ao trocar de aba (mestre seção 5) | teste da thread 06 |

### 10.1 Contraste da paleta mestre (calculado, WCAG 2.x)
| Texto \\ fundo | #16151C abissal | #342A27 madeira | #51465B cinza |
|---|---|---|---|
| #DED0B5 pergaminho | 11,9 ✓ | 9,2 ✓ | 5,8 ✓ |
| #E5B56B vela | 9,6 ✓ | 7,4 ✓ | 4,7 ✓ |
| #B49A65 ouro velho | 6,7 ✓ | 5,1 ✓ | 3,3 só texto grande |
| #85B6A7 verde espectral | 8,0 ✓ | 6,1 ✓ | 3,9 só texto grande |
| #8063A6 violeta | 3,7 ✕ texto pequeno | 2,8 ✕ | 1,8 ✕ |
| #A34747 vermelho ritual | 3,1 ✕ texto pequeno | 2,4 ✕ | 1,5 ✕ |

Consequências para a UI (a paleta é da thread 03; isto é pedido, não decisão):
- Vermelho e violeta da paleta servem para superfícies, molduras e ícones grandes, não para texto pequeno.
- Propostas de tons de texto derivados: vermelho-texto `#D97B7B` (6,1 em abissal, 4,7 em madeira) e violeta-texto `#B39AD6` (7,4 em abissal, 5,7 em madeira). A thread 03 aprova ou substitui no ART_BIBLE.
- Texto essencial nunca sobre textura intensa; painéis de texto usam fundo liso abissal ou madeira.

## 11. Configurações (mínimo P1)
Velocidade (1×/2×/instantânea), movimento reduzido, arrastar (liga/desliga), atalhos de teclado (liga/desliga), tamanho de texto, mudo e volumes (quando houver áudio, thread 06), rever tutorial, copiar seed, apagar save (com confirmação dupla). Configurações sobrevivem a "nova partida" (D009: reset preserva configurações).

## 12. Chaves de texto propostas (para a thread 07)
Não adicionei chaves em `src/ui/strings.ts` (arquivo da thread 07 nesta fase). Lista de chaves que a UI vai precisar, com o texto placeholder deste documento:
`hud.night`, `hud.balance`, `hud.tribute`, `hud.curse`, `hud.band.{stable,low,mid,high}`, `bench.cell.empty`, `bench.cell.relic`, `bench.cell.target`, `bench.cell.startOrder`, `preview.label`, `preview.gain`, `preview.curse`, `preview.afterTribute`, `preview.defeat`, `preview.short`, `preview.bandNextNight`, `action.bell`, `action.undo`, `action.sell`, `action.reroll`, `action.skip`, `action.pause`, `market.title`, `market.pickCell`, `market.noFunds`, `market.full`, `reward.title`, `reward.hint`, `reward.full`, `reward.refuse`, `payment.title`, `payment.body`, `end.win.title`, `end.loseCurse.title`, `end.loseDebt.title`, `end.newRun`, `end.sameSeed`, `end.copySeed`, `confirm.risk.*`, `error.resolution`, `error.save.*`, `undo.empty`, `log.<EVENT_TYPE>`, `tutorial.step{1,2,3}`, `tutorial.skip`, `hint.firstMarket`, `hint.firstBand`, `hint.firstReward`, `hint.firstDestroy`, `settings.*`.
Os textos finais (tom seco e burocrático) são da thread 07.

## 13. Diferenças em relação ao protótipo `sandbox-p1.html`
O protótipo é ferramenta de playtest; P1-005 deve seguir este documento onde divergirem:
1. Compra sem célula escolhida vai para a primeira livre → propor sempre pedir a célula (5.1).
2. Velocidade em `<select>` → controle segmentado 1×/2×/⏭ com alvo de 44 px.
3. Sem confirmação ao tocar o sino com prévia de derrota → `confirm-risk`.
4. Sem pular/pausar a resolução → adicionar.
5. Sino no fluxo da página → em mobile, barra de ações fixa no rodapé.
6. Livro-caixa sem recuo por causa → recuo por `causeSeq`.
7. Faixa de maldição só por texto curto e barra → adicionar ícone por faixa.
8. Botões desabilitados sem motivo → `aria-disabled` + motivo.

## 14. Aceitação para P1-005 (UI placeholder jogável)
- Partida completa de 5 noites jogável a 360×640 e a 1280×800, só com toque, só com teclado e com mouse.
- Sem rolagem horizontal a 360 px; bancada, prévia e sino na primeira dobra em 360×640.
- Prévia bate com o resultado da resolução em todas as fixtures da thread 09.
- Todos os estados da seção 4 alcançáveis em E2E (inclusive `error-resolution` por fixture de 257 eventos e bancada cheia na recompensa).
- axe sem violações sérias; A11Y-01, 04, 05, 08, 10, 11, 14 verificados por E2E.

## 15. Pontos em aberto
- **U01 (UX, sem mudança de regra):** compra sempre pede célula ou mantém o atalho "primeira livre"? Proposta: sempre pedir, com "primeira livre" via tecla.
- **U02:** permitir sino com bancada vazia? Proposta: sim, prévia +0 e aviso (a regra não proíbe).
- **U03:** `confirm-risk` aparece sempre que a prévia indicar derrota, ou só até o jogador desligar? Proposta: sempre, com opção "não perguntar de novo nesta partida".
- **Dependências:** alcance de vela sobre relíquias de início (A02/D001), alvo do anel e do fio (D002), o que o espelho mostra quando o vizinho à esquerda está inativo (A01b/D003). A UI só exibe o que o core responder; os textos de detalhe acompanham a decisão final.

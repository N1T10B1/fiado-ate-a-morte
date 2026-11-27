# GDD — Grave Credit
v0.2.0 | 2026-11-27 | base: Prompt Mestre Claude 1.0 (regras idênticas ao v0.1) | revisão P0 pendente

## Base herdada (não equivale a nova aprovação)
Nome do jogo: **Grave Credit** (D010). "Fiado até a Morte" foi o título de trabalho; não é usado como título localizado; só Grave Credit em todos os idiomas (D014). Verificação comercial/marca antes de publicar. Puzzle roguelite singleplayer, inventário espacial, combos e risco; HTML5 PC/mobile; 5–10 min protótipo, 15–25 min versão completa. Loja de antiguidades entre vivos e mortos; comerciante paga tributo sobrenatural. Humor seco e burocrático, horror gradual, escolhas legíveis e derrotas compreensíveis. Pilares: estratégia espacial, combos, lucro versus maldição, horror intimista e rejogabilidade.

## P1 — loop e hipóteses numéricas
Preparação → mercado → organização → prévia → invocação → resolução → pagamento → recompensa → próxima noite. Cinco noites (oito na versão completa). Grade 5×5 aberta, objetos de uma célula, vizinhança N/E/S/O. Início com 12 óbolos, vela, crânio, pena. Quatro ofertas/noite; reroll custa 2, incrementa 1 por uso na noite. Preços comuns 3–6, incomuns 7–10, raras 11–16; venda metade do preço-base arredondada para baixo, mínimo 1. Movimentos e trocas livres antes de invocar; undo exclusivamente espacial sem duplicar recursos. Tributos 10/22/40/65/100; curva completa candidata acrescenta 150/220/320. Saldo remanescente passa de noite; maldição 100 ou saldo insuficiente derrota; maldição 100 precede pagamento. Após pagamento, escolher uma de três recompensas elegíveis ou recusar, exceto última noite. Modificador da última noite ainda requer decisão D007. Sem empréstimos ou ressurreições.

## Catálogo P1 (hipóteses do mestre)
| ID | Nome | Efeito |
|---|---|---|
| candle | Vela funerária | Início: desperta vizinhos ortogonais elegíveis inativos |
| skull | Crânio sussurrante | Despertar: +10 |
| mirror | Espelho partido | Despertar: copia ganho-base permitido do item à esquerda, sem multiplicadores/gatilhos |
| bell | Sino dos mortos | Despertar: enfileira crânios inativos |
| eye | Olho do abismo | Despertar: dobra próximo ganho direto positivo de outra relíquia |
| hourglass | Ampulheta invertida | Despertar: repete último ganho direto positivo elegível, sem novo multiplicador |
| book | Livro proibido | Despertar: +18 óbolos, +8 maldição |
| feather | Pena angelical | Início: −5 maldição, mínimo zero |
| ring | Anel de sacrifício | Despertar: destrói primeiro vizinho elegível N/E/S/O; +16 apenas se houver alvo válido |
| tooth | Dente do devorador | Despertar: +4 +3 por objeto destruído na partida |
| coin | Moeda de velório | Início: +4 |
| thread | Fio de mortalha | Despertar: desperta vizinho elegível inativo N/E/S/O; +2 maldição |

Arquétipos: necromancia, reflexão, abismo (prioritários), purificação, devoração, temporal. 24 relíquias após validação; 100 somente após vertical slice e se justificado. A cadeia de 60 do mestre é hipótese a provar com fixture válida, não resultado garantido. Raridades, tags, preços e pesos propostos em `docs/RELICS.md` (D021, D023); efeitos formais lá e em `docs/RULES.md`.

## Resolução
Snapshot da bancada; fila FIFO determinística; início em ordem de leitura; efeitos derivados no fim; vizinhos N/E/S/O, desempate ID; objetos destruídos não ativam depois; uma ativação padrão, duas somente por reativação explícita. Cópia sem recursão; repetição sem repetir repetição; máximo defensivo 256 eventos/noite, truncamento é defeito. Prévia sem alterar estado ou consumir seed; produção determinada exata, resultados incertos como faixa/condições. Sem dependência de FPS. Semântica operacional em ARCHITECTURE e propostas D001–D005.

## Maldição
0–100 inteiro; sem queda automática. Faixas congeladas no início: 0–29 sem bônus; 30–59 +25%; 60–89 +50% e bloqueio candidato de célula vazia na próxima noite; 90–99 +100% e consumo candidato com alvo destacado; 100 derrota imediata. Bônus só em ganhos diretos tag abyss, arredondado para baixo; sem reaplicação em cópia/repetição. D005 propõe testar bônus/derrota antes de penalidades espaciais; isso não as remove definitivamente.

## UX, arte e áudio
Bancada central; mercado lateral no PC, inferior no celular; saldo, tributo, maldição visíveis; sino inequívoco; prévia de alcance, origem/destino e log; teclado, toque selecionar + destino, arrastar opcional; movimento reduzido; velocidades 1×/2×/instantânea; feedback textual além de cor e som. Placeholder no P1. Direção: armazém brasileiro antigo, latão, madeira, vidro sujo, vela, pintura 2D/gravura; sem gore gratuito. Paleta mestre: #16151C #342A27 #B49A65 #A34747 #8063A6 #85B6A7 #DED0B5 #51465B #E5B56B. Áudio sintetizado original, gesto para desbloqueio, buses separados, mute e limites de vozes; implementação refinada P2.

## Gates
P1: partida completa, derrota/vitória/reinício, sem arte final, determinismo e sem duplicação; playtest de diversão e compreensão. P2: arte aprovada, áudio, tutorial, eventos, 24 relíquias, mobile; P3: oito noites, progressão horizontal, diário, i18n pt-BR/en, saves migráveis; P4: estabilidade/compatibilidade; P5: publicação autorizada. Seed e log no MVP; compartilhamento de replay/clipes depois. Sem FOMO, apostas reais ou monetização predatória.

## Aprovação pendente
D001–D009 em DECISIONS. Nenhum preço exato, peso de sorteio, taxa de vitória ou resultado de playtest validado. GDD não substitui o mestre onde omisso.

## Ambiguidades A01–A07 (respondidas em P0-02a, propostas)
Regras completas em `docs/RULES.md`; catálogo, critérios e fixtures em `docs/RELICS.md`. Respostas ainda são PROPOSTA (D019–D025) até o gate P0-G.
- **A01 — combo 60.** Válido com duas velas e um fio: crânio (0,0), espelho (0,1), sino (1,0), vela (1,1), crânio (1,2), olho (2,1), vela (3,3), fio (3,4), ampulheta (2,4) ⇒ 10 + 10 + 20 + 20 = **60**, maldição +2. Fixture A01 em RELICS.
- **A01b — sim.** O espelho copia o ganho-base estático da relíquia a oeste em qualquer estado (inativa, reservada ou ativada), desde que viva (D020). É o que torna A01 possível.
- **A02 — não.** Vela só desperta relíquias de gatilho DESPERTAR; relíquias de INÍCIO ativam pela fila inicial (fixture C3).
- **A03 — não.** Cópia não conta como ganho direto: não gasta ficha do olho e não é repetida pela ampulheta (O4, H4).
- **A04 — sim.** Fio sem alvo ainda soma +2 de maldição (F2).
- **A05 —** Ganho do livro é creditado antes da maldição; se a maldição chega a 100, derrota imediata e o ganho não salva a partida (L8).
- **A06 — sim.** Faixa fixada no toque do sino, tanto subindo quanto descendo (L9, P3).
- **A07 —** Bancada cheia: nenhuma recompensa, a tela explica e o jogador segue. P1 não tem recompensas não espaciais.

# Fila de pedidos de arte (ChatGPT Images) — v0.2.1
Status: **nenhum pedido enviado**. Cinco rascunhos da amostra abaixo (seção "Rascunhos da amostra"), escritos a partir de `docs/ART_BIBLE.md` v0.1, que ainda aguarda aprovação. O protótipo P1 roda com placeholders. Pedidos só depois do gate P1 (partida completa jogável) e de uma ART_BIBLE aprovada. Primeiro lote: amostra pequena, uma relíquia por família visual, um fundo e uma peça de UI. Nunca encomendar em massa.

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
| 1 | relic_candle | P2 amostra | necromancia | rascunho (não enviado) |
| 2 | relic_mirror | P2 amostra | reflexão | rascunho (não enviado) |
| 3 | relic_book | P2 amostra | abismo | rascunho (não enviado) |
| 4 | bg_shop_desktop | P2 amostra | fundo 1920×1080 | rascunho (não enviado) |
| 5 | ui_bell_button | P2 amostra | UI | rascunho (não enviado) |

Convenções: snake_case; relíquias com fonte quadrada 1024 px e exportação 128/256 px em `public/assets/relics/`; fundos em `public/assets/backgrounds/`; nenhum texto dentro das imagens.

A amostra cobre as três famílias prioritárias do MVP (necromancia, reflexão, abismo). Purificação, devoração e temporal entram só depois da folha de referência aprovada (ART_BIBLE seção 11). Ordem de envio sugerida: 1 → avaliar → 2 e 3 com a 1 anexada → 4 → 5. Não enviar as cinco de uma vez antes da primeira ser avaliada, porque a vela define luz, linha e câmera para as outras.

## Rascunhos da amostra
Cada bloco é autocontido e pode ser colado no ChatGPT Images. O gerador trabalha em 1024×1024, 1536×1024 ou 1024×1536; os tamanhos finais saem por recorte/redimensionamento e as dimensões reais vão para o manifesto.

### 1. relic_candle
```text
ASSET ID: relic_candle
Prioridade / milestone: 1 / P2 amostra (família necromancia; define o padrão de luz, linha e câmera)
Arquivo esperado (caminho e extensão): original em assets_src/relics/relic_candle.png; exportações public/assets/relics/relic_candle_256.webp e relic_candle_128.webp
Função no jogo / estado de UI: relíquia "Vela funerária" numa célula da bancada 5×5, em repouso; estados (ativa, selecionada, alvo) são feitos pelo código
Dimensões-alvo, proporção, área segura e enquadramento: 1024×1024, quadrado; objeto centralizado ocupando 70–80% da altura; 10% de margem vazia em todos os lados; base da vela pousada a ~85% da altura
Transparência alfa ou fundo opaco: fundo transparente (alfa real), sem sombra projetada
Prompt completo em português:
Uma única vela funerária de cera amarelada, grossa e um pouco torta, com escorridos de cera endurecida, num castiçal baixo de latão gasto com uma pequena alça em argola. Chama pequena e calma, com o núcleo cor de luz de vela (#E5B56B) e uma borda fina verde espectral (#85B6A7) que sugere algo sobrenatural sem brilhar demais. Pintura digital 2D com acabamento de gravura antiga: massas de cor chapadas, contorno irregular controlado em marrom muito escuro (#16151C), hachuras finas só nas sombras, textura leve de impressão em papel. Paleta restrita: #16151C, #342A27, #B49A65, #E5B56B, #DED0B5, #51465B, com #85B6A7 só na borda da chama. Luz principal quente vinda de cima e da esquerda; sombras frias e contidas caindo para baixo e à direita; filete frio fino no contorno direito. Vista em três-quartos suave, câmera um pouco acima (cerca de 20 graus), como um objeto pousado num balcão. Silhueta simples e vertical, legível quando reduzida a 32 pixels. Objeto isolado sobre fundo transparente, sem chão, sem sombra projetada, sem moldura.
Referências aprovadas a anexar: nenhuma ainda (este é o primeiro asset); anexar docs/ART_BIBLE.md seções 2–6 como texto se o Rafael quiser
Não incluir: texto, letras, números, marca d'água; caveiras, sangue, gore; fumaça, névoa, partículas ou halo grande; castiçal ornamentado com filigrana; cromado ou aparência 3D/plástica; mais de uma vela; mesa, toalha ou fundo; moldura ou vinheta
Critérios técnicos e visuais de aceitação: alfa real (sem xadrez pintado); margem de 10% livre; luz da esquerda-alto; linha marrom-escura, não preta; cores dentro da paleta; verde só na chama e ≤ 10% da área; silhueta reconhecível a 32 px; legível a 56 px sobre #342A27; sem nenhum item da lista "Não incluir"
Fallback provisório: glifo atual do protótipo (prototypes/sandbox-p1.html)
```

### 2. relic_mirror
```text
ASSET ID: relic_mirror
Prioridade / milestone: 2 / P2 amostra (família reflexão)
Arquivo esperado (caminho e extensão): original em assets_src/relics/relic_mirror.png; exportações public/assets/relics/relic_mirror_256.webp e relic_mirror_128.webp
Função no jogo / estado de UI: relíquia "Espelho partido" numa célula da bancada, em repouso; estados pelo código
Dimensões-alvo, proporção, área segura e enquadramento: 1024×1024, quadrado; objeto centralizado ocupando 70–80% da altura, levemente inclinado na diagonal; 10% de margem vazia; ponto de apoio a ~85% da altura
Transparência alfa ou fundo opaco: fundo transparente (alfa real), sem sombra projetada
Prompt completo em português:
Um espelho de mão oval antigo, com moldura simples de latão escurecido e cabo reto de madeira escura gasta, deitado levemente inclinado como se repousasse num balcão. O vidro tem a prata manchada e uma única rachadura diagonal limpa atravessando a superfície. Dentro do vidro não há rosto nem figura: apenas um reflexo baço em cinza (#51465B) com um leve tom verde espectral (#85B6A7) ao longo da rachadura, como se o espelho refletisse algo que não está ali. Pintura digital 2D com acabamento de gravura antiga: massas de cor chapadas, contorno irregular controlado em marrom muito escuro (#16151C), hachuras finas só nas sombras, textura leve de impressão. Paleta restrita: #16151C, #342A27, #B49A65, #DED0B5, #51465B, com #85B6A7 só no reflexo e ≤ 10% da área. Luz principal quente (#E5B56B) vinda de cima e da esquerda, um único reflexo pontual no vidro; sombras frias caindo para baixo e à direita. Mesma câmera da vela: três-quartos suave, cerca de 20 graus acima. Silhueta oval com cabo, legível a 32 pixels. Objeto isolado sobre fundo transparente, sem chão, sem sombra projetada, sem moldura de cartão.
Referências aprovadas a anexar: relic_candle aprovado (luz, linha, câmera)
Não incluir: rosto, olhos, figura ou reflexo do observador; texto ou marcas; cacos soltos voando; moldura barroca ornamentada; cromado, reflexos de estúdio, aparência 3D; brilho ou fumaça; fundo, mesa ou sombra
Critérios técnicos e visuais de aceitação: os mesmos da relic_candle, mais: mesma espessura de linha e densidade de hachura da vela a 256 px; silhueta claramente diferente da vela e do livro a 32 px; rachadura legível a 56 px
Fallback provisório: glifo atual do protótipo
```

### 3. relic_book
```text
ASSET ID: relic_book
Prioridade / milestone: 3 / P2 amostra (família abismo)
Arquivo esperado (caminho e extensão): original em assets_src/relics/relic_book.png; exportações public/assets/relics/relic_book_256.webp e relic_book_128.webp
Função no jogo / estado de UI: relíquia "Livro proibido" numa célula da bancada, em repouso; estados pelo código
Dimensões-alvo, proporção, área segura e enquadramento: 1024×1024, quadrado; livro fechado centralizado ocupando 70–80% da largura; 10% de margem vazia; base a ~85% da altura
Transparência alfa ou fundo opaco: fundo transparente (alfa real), sem sombra projetada
Prompt completo em português:
Um livro-caixa antigo, grosso e fechado, encadernado em couro escuro rachado, com cantoneiras e um fecho de latão gasto trancado por um pequeno cadeado. Uma fita de marcador vermelho ritual (#A34747) escapa por baixo da capa. Pelas frestas entre as páginas amareladas vaza uma luz violeta fraca (#8063A6), pouca e contida, como se algo lá dentro estivesse acordado. A capa é lisa, sem título, sem letras e sem símbolos. Pintura digital 2D com acabamento de gravura antiga: massas de cor chapadas, contorno irregular controlado em marrom muito escuro (#16151C), hachuras finas só nas sombras, textura leve de impressão. Paleta restrita: #16151C, #342A27, #B49A65, #DED0B5, #51465B, com #A34747 só na fita e #8063A6 só nas frestas, cada um ≤ 10% da área. Luz principal quente (#E5B56B) vinda de cima e da esquerda; sombras frias caindo para baixo e à direita. Mesma câmera da vela: três-quartos suave, cerca de 20 graus acima. Silhueta de bloco horizontal com o fecho visível, legível a 32 pixels. Objeto isolado sobre fundo transparente, sem chão, sem sombra projetada.
Referências aprovadas a anexar: relic_candle aprovado; relic_mirror se já aprovado
Não incluir: texto, letras, runas, pentagramas ou símbolos na capa ou nas páginas; olhos, rostos ou bocas no livro; sangue ou carne; correntes enormes; fumaça, névoa ou raios; livro aberto; brilho violeta tomando o objeto; fundo ou sombra
Critérios técnicos e visuais de aceitação: os mesmos da relic_candle, mais: violeta só nas frestas e legível como "sobrenatural" a 56 px sem dominar; capa sem nenhum glifo; silhueta diferente da vela e do espelho a 32 px
Fallback provisório: glifo atual do protótipo
```

### 4. bg_shop_desktop
```text
ASSET ID: bg_shop_desktop
Prioridade / milestone: 4 / P2 amostra (fundo)
Arquivo esperado (caminho e extensão): original em assets_src/backgrounds/bg_shop_desktop.png; exportação public/assets/backgrounds/bg_shop_desktop.webp
Função no jogo / estado de UI: fundo da tela de jogo no desktop, atrás da bancada, do mercado e do placar (todos desenhados pelo código)
Dimensões-alvo, proporção, área segura e enquadramento: alvo 1920×1080 (16:9); gerar em 1536×1024 paisagem e recortar para 16:9; o terço central da imagem é a área da bancada, com pouco detalhe e baixo contraste; faixa direita (~25% da largura) também calma, para o mercado
Transparência alfa ou fundo opaco: opaco
Prompt completo em português:
Interior de uma pequena loja de antiguidades de rua à noite, misturada com um armazém brasileiro antigo, vista por quem está em pé atrás do balcão. Em primeiro plano, a superfície larga de um balcão de madeira escura (#342A27), gasta, com marcas de copo e arranhões, ocupando o centro e a parte de baixo do quadro, lisa e calma. Ao fundo, prateleiras de madeira com vidros de bala baços, frascos, latas sem rótulo legível, uma balança de pratos de latão, uma caderneta de fiado fechada e recibos espetados num prego. Piso de ladrilho hidráulico gasto quase na sombra. À direita, ao fundo, a porta de vidro sujo mostra a rua escura com chuva fina. A única luz é de uma vela fora do quadro à esquerda, quente (#E5B56B), iluminando de lado as prateleiras; o resto cai em sombras frias e contidas (#51465B, #16151C). Pintura digital 2D com acabamento de gravura antiga: massas de cor chapadas, contorno irregular em marrom muito escuro, hachuras nas sombras, textura leve de impressão. Paleta restrita: #16151C, #342A27, #B49A65, #E5B56B, #DED0B5, #51465B; nada de violeta ou verde. Contraste geral baixo; nenhuma área mais clara que pergaminho escurecido, exceto o reflexo da vela. Perspectiva frontal, ponto de fuga central e baixo, sem distorção de grande-angular. Clima de silêncio e espera, estranho mas não assustador.
Referências aprovadas a anexar: relic_candle aprovado (luz e técnica)
Não incluir: texto, letreiros, placas, rótulos legíveis, números; pessoas, rostos, mãos, vultos; caveiras, sangue; moldura, painéis ou botões de interface; névoa, fumaça, raios de luz volumétricos; castelo, cripta ou gótico medieval; bandeira ou estereótipos brasileiros; objetos importantes no centro do balcão
Critérios técnicos e visuais de aceitação: dimensões reais registradas e recorte 16:9 sem distorcer; luz pela esquerda como nas relíquias; centro e faixa direita calmos; com a grade placeholder do protótipo por cima, a grade e o texto do placar continuam legíveis; em cinza, as relíquias aprovadas se destacam do balcão; sem nenhum item da lista "Não incluir"; WebP ≤ 400 KB
Fallback provisório: cor sólida #16151C com o balcão em #342A27 (protótipo atual)
```

### 5. ui_bell_button
```text
ASSET ID: ui_bell_button
Prioridade / milestone: 5 / P2 amostra (peça de UI: botão de invocar)
Arquivo esperado (caminho e extensão): original em assets_src/ui/ui_bell_button.png; exportações public/assets/ui/ui_bell_button_256.webp e ui_bell_button_128.webp
Função no jogo / estado de UI: imagem do botão "tocar o sino" que inicia a invocação; rótulo, tecla e estados (foco, pressionado, desabilitado) são feitos pelo código
Dimensões-alvo, proporção, área segura e enquadramento: 1024×1024, quadrado; sino centralizado ocupando 70% da altura; 15% de margem vazia (o código anima um leve balanço)
Transparência alfa ou fundo opaco: fundo transparente (alfa real), sem sombra projetada
Prompt completo em português:
Uma sineta de balcão antiga de latão (#B49A65), do tipo que fica sobre o balcão de um armazém, com base redonda de madeira escura (#342A27) e um pequeno martelo de ferro no topo. O latão está gasto, com pátina escura nas reentrâncias e um só brilho quente onde a luz bate. Na borda inferior do sino, uma mancha fina de vermelho ritual (#A34747), como um lacre antigo. Pintura digital 2D com acabamento de gravura antiga: massas de cor chapadas, contorno irregular controlado em marrom muito escuro (#16151C), hachuras finas nas sombras, textura leve de impressão. Paleta restrita: #16151C, #342A27, #B49A65, #E5B56B, #DED0B5, #51465B, #A34747 (≤ 10%). Luz quente vinda de cima e da esquerda; sombras frias à direita. Vista em três-quartos suave, cerca de 20 graus acima, mesma câmera das relíquias. Forma simples e robusta, reconhecível como "botão" mesmo a 48 pixels. Objeto isolado sobre fundo transparente, sem chão e sem sombra projetada.
Referências aprovadas a anexar: relic_candle aprovado; bg_shop_desktop se já aprovado
Não incluir: texto, letras ou números; mão tocando o sino; ondas sonoras, linhas de movimento ou brilho mágico; violeta ou verde; ornamentos e filigrana; cromado ou aparência 3D; moldura de botão, círculo de fundo ou sombra
Critérios técnicos e visuais de aceitação: alfa real; margem de 15%; legível a 48 px; distinto da relíquia "sino dos mortos" (este é uma sineta de balcão com base, aquele será um sino pendurado de alça); cores dentro da paleta; luz e linha iguais às relíquias aprovadas
Fallback provisório: botão HTML do protótipo com o rótulo atual
```

# Bíblia visual — Grave Credit
v0.1 (rascunho P0-04) | 2026-11-27 | thread 03 | status: **proposta, aguarda aprovação do Rafael**

Base: seção 4 do Prompt Mestre Claude e seção "UX, arte e áudio" do GDD. Este documento não aprova nenhum asset e não gera imagens. Tudo aqui é regra para pedir, avaliar e recusar arte. Onde ele fixa algo que é escolha de identidade, a escolha está marcada como **[decisão do diretor]**.

## 1. Identidade em uma frase
Uma loja de antiguidades de rua, meio armazém brasileiro antigo, iluminada por uma vela só, onde cada objeto parece ter sido vendido fiado a alguém que já morreu. Gótico intimista, não castelo; horror sugerido, não gore; humor seco de livro-caixa.

### Vocabulário de materiais (usar)
- Madeira escura envernizada e gasta nas quinas, balcão de armazém com marcas de copo e de faca.
- Latão e ferro fundido: ferragens, balança de pratos, puxadores, pregos, cadeados.
- Vidro sujo e baço: vidros de bala, frascos, lampião, espelho com a prata manchada.
- Papel: caderneta de fiado, recibos espetados num prego, papel de embrulho pardo, barbante.
- Cera, tecido de mortalha, osso amarelado, couro rachado.
- Detalhes brasileiros discretos: ladrilho hidráulico gasto, azulejo antigo quebrado, latas sem marca legível, régua de medir tecido, santinho desbotado sem rosto definido. Nunca caricatura nem bandeira.

### Tom visual
Seco e contido. O estranho aparece num detalhe (uma chama que se inclina para o lado errado, um recibo assinado com digital), não em névoa, raios ou caveiras por toda parte.

## 2. Técnica
- **Pintura digital 2D com acabamento de gravura antiga.** Massas de cor pintadas e chapadas, por cima uma linha de contorno irregular controlada e hachuras nas sombras, como cópia impressa de gravura em metal.
- Linha de contorno em marrom muito escuro (#16151C a #342A27), nunca preto puro, espessura variável, mais grossa no lado da sombra.
- Hachura só nas sombras e meios-tons; luzes limpas. Textura de papel/impressão leve, visível em 100% e invisível em 64 px.
- Volumes legíveis: no máximo três valores por objeto (luz, meio-tom, sombra) mais um realce pontual.
- Contraste concentrado no objeto; fundo e bordas mais calmos.
- Não citar nem imitar artista vivo ou estilo identificável. Descrever técnica, material e composição.

## 3. Paleta
Paleta mestre (GDD) com papéis fixos. Valores fora dela são permitidos só como tons intermediários entre duas cores da paleta.

| HEX | Nome | Papel | Restrição |
|---|---|---|---|
| #16151C | preto abissal | fundo profundo, linhas, sombra mais escura | nunca usar #000000 |
| #342A27 | madeira | balcão, móveis, sombras quentes | — |
| #B49A65 | ouro velho | latão, moedas, valor em dinheiro | brilho metálico só em pontos |
| #E5B56B | luz de vela | luz principal, chama, realce quente | é a cor mais clara quente da cena |
| #DED0B5 | pergaminho | papel, osso, cera, texto da UI | cor mais clara da imagem; não usar branco puro |
| #51465B | cinza | sombras frias, pedra, poeira | — |
| #A34747 | vermelho ritual | maldição, perigo, lacre, sangue seco | ≤ 10% da área de um asset; nunca escorrendo |
| #8063A6 | violeta | sobrenatural: abismo, poder, maldição em ação | só como informação sobrenatural; ≤ 10% da área |
| #85B6A7 | verde espectral | sobrenatural: despertar, almas, reflexo | só como informação sobrenatural; ≤ 10% da área |

Regras:
- **Violeta e verde não decoram.** Aparecem só onde há algo sobrenatural para ler (a chama da vela que desperta, o fundo do olho). Um objeto comum não ganha brilho violeta.
- Vermelho ritual não é a cor do sangue de gore. É lacre, fita, tinta de assinatura.
- Saturação geral baixa; o ponto mais saturado de cada asset é a informação sobrenatural ou a chama.
- A UI usa as mesmas cores como tokens (já presentes no protótipo `prototypes/sandbox-p1.html`). Arte e UI compartilham a paleta, então nenhuma arte deve depender de uma cor que a UI usa para estado (ver seção 7).

### 3.1 Tons só para texto (decisão da thread 03, 2026-11-27)
O vermelho ritual e o violeta não alcançam 4,5:1 sobre os fundos escuros (cálculo WCAG 2.x, conferido a partir de `docs/UX.md` seção 10.1, PR #8). Ficam adotados dois tons derivados, **exclusivos para texto e ícones pequenos da UI**:

| Token | HEX | Deriva de | Contraste em #16151C | em #342A27 | em #51465B |
|---|---|---|---|---|---|
| ritual-texto | #D97B7B | #A34747 | 6,1 ✓ | 4,7 ✓ | 3,0 só texto ≥ 24 px |
| violeta-texto | #B39AD6 | #8063A6 | 7,4 ✓ | 5,7 ✓ | 3,6 só texto ≥ 24 px |

Regras:
- #A34747 e #8063A6 continuam valendo para superfícies, molduras, barras e ícones grandes (≥ 3:1), nunca para texto pequeno.
- Os tons de texto **não entram na arte** nem nos prompts do ChatGPT; a arte segue a paleta da tabela acima.
- Texto pequeno só sobre #16151C ou #342A27 lisos. #51465B não é fundo de texto pequeno em nenhuma cor de destaque, e também não é cor de texto (2,0:1 sobre o abissal).
- Cores de texto já aprovadas sem ajuste: #DED0B5, #E5B56B, #B49A65 e #85B6A7 (todas ≥ 5:1 no abissal e na madeira).

## 4. Iluminação
- **Luz principal:** vela, quente (#E5B56B), vinda de **cima e da esquerda, levemente à frente** (aprox. 45° acima, 45° à esquerda). Igual em todas as relíquias e fundos.
- **Sombras:** frias e contidas (#51465B → #16151C), caindo para baixo e à direita. Sem preto chapado ocupando grandes áreas.
- **Contraluz:** filete frio opcional no contorno direito, fino, para separar o objeto do fundo escuro da bancada.
- **Brilho próprio:** só objetos sobrenaturais acesos (chama, olho). Brilho curto, sem halo enorme nem bloom.
- **Sombra projetada:** **não pintar** nas relíquias. A UI desenha uma sombra de contato comum a todas, para que a direção da sombra não varie entre assets.
- Fundos seguem a mesma luz: a fonte de luz da loja fica à esquerda, fora ou na borda do quadro.

## 5. Perspectiva e escala
- **Relíquias:** vista frontal em três-quartos suave, câmera um pouco acima (aprox. 20° de elevação), como um objeto pousado no balcão visto por quem está de pé atrás dele. Mesma câmera para as 12. Nada de vista de topo pura nem isométrica.
- **Fundos:** mesma altura de olhar (pessoa em pé atrás do balcão), perspectiva frontal com ponto de fuga central e baixo, sem grande-angular distorcida.
- **Escala no jogo:** cada relíquia ocupa uma célula. Célula renderizada de ~56 px (celular de 360 px) a ~96 px (desktop, bancada de até 520 px). Exportações 128 e 256 px cobrem até densidade 2×.
- **Escala relativa:** não é realista. Todas as relíquias ocupam a mesma "caixa visual" para serem iguais em peso no tabuleiro. Uma moeda e um livro têm a mesma presença; a moeda é mostrada grande e de perto, o livro um pouco mais de longe.
- **Enquadramento do asset de relíquia:** objeto centralizado, ocupando 70–80% da maior dimensão da tela; margem segura de 10% em todos os lados sem nada (nem chama, nem fumaça). O ponto de apoio do objeto fica a cerca de 85% da altura, para todos pousarem na mesma linha.

## 6. Silhuetas
Cada relíquia deve ser reconhecível **só pela silhueta preenchida a 32 px**, sem cor. Classes de forma propostas, para que nenhuma duas se confundam:

| Relíquia | Família visual (proposta) | Forma dominante | Leitura em 32 px |
|---|---|---|---|
| candle (vela funerária) | necromancia | vertical fina, chama no topo | haste alta com ponta |
| skull (crânio sussurrante) | necromancia | redonda, base achatada | bola com mandíbula |
| bell (sino dos mortos) | necromancia | trapézio de boca larga, alça no topo | sino clássico |
| thread (fio de mortalha) | necromancia | carretel com fio solto em curva | carretel + rabo |
| mirror (espelho partido) | reflexão | oval de mão com cabo, rachadura diagonal | raquete oval |
| eye (olho do abismo) | abismo | esfera/olho em suporte de latão | círculo sobre pé |
| book (livro proibido) | abismo | retângulo largo, fecho/cadeado | bloco horizontal |
| feather (pena angelical) | purificação | curva diagonal longa | traço em S diagonal |
| ring (anel de sacrifício) | devoração | aro com pedra grande, visto inclinado | argola com ponto |
| tooth (dente do devorador) | devoração | presa curva pontuda | gancho |
| hourglass (ampulheta invertida) | temporal | dois cones e tampas, ponta para cima | ampulheta |
| coin (moeda de velório) | comércio (neutra) | disco em três-quartos, furo no meio | elipse com furo |

Famílias são proposta visual; as tags de jogo dependem de D006 e da thread 01. A família **não** é identificada pela cor da arte: a UI mostra família por ícone e rótulo. A arte só reforça com material (necromancia: osso, cera, ferro; reflexão: prata manchada, vidro; abismo: couro escuro, latão, violeta; purificação: pergaminho, branco-pergaminho; devoração: osso, ouro sujo, vermelho; temporal: vidro, latão, areia).

Teste de silhueta obrigatório antes de aprovar qualquer relíquia: preencher o alfa de preto, reduzir a 32 px e comparar lado a lado com as já aprovadas.

## 7. Estados e o que é do código
Para não multiplicar assets, **cada relíquia tem uma só imagem** no P2. O código faz:
- inativa/ativa/despertada, selecionada, alvo, bloqueada, destruída (filtros, contorno, realce, partículas simples);
- sombra de contato, moldura da célula, número de ordem, rótulos e valores;
- linhas de origem e destino de combos.

Consequência para a arte: a relíquia é pintada **em repouso, "apagada"**, sem efeito de ativação, para que o realce do código tenha onde subir. A vela tem chama pequena e calma; o olho está semicerrado. Uma segunda pose (ativa) só se a amostra mostrar que o realce por código não basta, e com decisão registrada.

Cores de estado da UI (protótipo): seleção #E5B56B, alvo #85B6A7, bloqueio #A34747. A arte não usa contorno dessas cores, para não parecer estado.

## 8. Fundos
- Composição-alvo: desktop 16:9 (1920×1080) e celular 9:16 (1080×1920). O gerador não garante esse tamanho: gerar no maior formato próximo, recortar e registrar dimensões reais no manifesto.
- Cena: interior da loja à noite, visto de trás do balcão. Prateleiras, frascos, balança, caderneta, recibos no prego, porta de vidro com rua escura e chuva fina.
- **Zona da bancada:** o terço central (desktop) ou a metade superior-central (celular) é madeira de balcão com pouco detalhe e baixo contraste, porque a UI desenha a grade ali. Nenhum objeto importante sob a área da grade, do mercado ou do placar.
- Contraste total do fundo mais baixo que o das relíquias: valores do fundo entre #16151C e ~#7A6A55, exceto a chama da vela, se aparecer.
- Sem moldura de UI, sem painéis, sem texto, sem placas legíveis, sem personagem principal em quadro. A entidade nunca aparece inteira; no máximo uma mão ou sombra, e só em fundos futuros.
- Evolução com a maldição (P2/P3, fora da amostra): variantes do mesmo enquadramento, com a loja mais torta, úmida e escura. Mesma câmera para permitir transição.

## 9. Peças de UI
- A interface é feita em código (HTML/CSS) com a paleta. Arte de UI só onde um objeto pintado ajuda a leitura: o **sino de invocar** é a primeira e principal.
- Botões pintados não levam texto. O rótulo ("Tocar o sino", tecla, estado) é do código, ao lado ou abaixo.
- Estados (normal, foco/hover, pressionado, desabilitado) são feitos em código sobre uma imagem única, salvo decisão contrária após a amostra.
- Ícones pequenos (óbolo, maldição, tributo, famílias) ficam para depois da amostra; até lá, glifos do protótipo.
- Texto importante nunca sobre textura intensa: painéis chapados com a paleta.

## 10. Proibições
Recusar o asset se tiver qualquer um destes:
- texto, letras, números, marcas, logotipos, assinatura ou marca d'água (inclui "pseudo-texto" em livros e placas);
- gore, sangue escorrendo, vísceras, olhos humanos arrancados realistas, corpos;
- excesso de ornamentos, filigrana em tudo, simetria artificial sem motivo;
- névoa ou fumaça indiscriminada, brilho/bloom em tudo, partículas mágicas decorativas;
- aparência plastificada, 3D renderizado, metal cromado, reflexos de estúdio;
- objetos inconsistentes (dois cabos, chama sem pavio, ampulheta sem lógica de areia), mãos ou anatomia errada;
- moldura, borda, fundo de cartão, vinheta ou sombra projetada nas relíquias;
- castelo medieval, cripta de fantasia genérica, vilão de capa, caveira estilizada de tatuagem;
- cópia de jogo existente (Balatro, Inscryption, Backpack Battles, Vampire Survivors ou outros) ou estilo de artista vivo identificável;
- estereótipo de Brasil (bandeira, verde-amarelo, carnaval, papagaio).

## 11. Folha de referência
Não existe ainda. Ela nasce da amostra (ver `docs/ASSET_REQUESTS.md`) e só depois dela a produção pode crescer.

Montagem, após aprovar a amostra:
1. As relíquias aprovadas lado a lado, a 256 px, 96 px, 64 px e em silhueta 32 px.
2. As mesmas relíquias pousadas na zona da bancada do fundo aprovado, com a grade placeholder do protótipo por cima.
3. Versão em escala de cinza da prancha inteira (teste de valor).
4. A peça de UI ao lado do placar placeholder em 360 px e em desktop.
5. Amostras de cor medidas de cada asset, comparadas com a paleta.

Critérios para a folha ser aprovada pelo Rafael:
- a mesma luz (esquerda-alto) em todos os assets, sem exceção;
- mesma espessura e cor de linha e mesma densidade de hachura a 256 px;
- todas as silhuetas distintas a 32 px;
- em cinza, cada relíquia se destaca da madeira da bancada;
- nenhuma cor sobrenatural fora de função;
- o fundo não compete com a grade nem com o placar;
- nada da lista de proibições.

A folha aprovada vira o anexo obrigatório de todos os pedidos seguintes ("Referências aprovadas a anexar").

## 12. Checklist de recepção (resumo para a thread 04)
Para cada arquivo recebido, antes de "aprovado": dimensões reais; alfa real (não xadrez pintado) nas relíquias; margem segura de 10%; ponto de apoio a ~85% da altura; teste de silhueta 32 px; teste em cinza sobre #342A27; leitura a 56 px; cores conferidas contra a paleta; luz esquerda-alto; ausência de texto; peso do arquivo exportado (meta: relíquia 256 px WebP ≤ 40 KB, fundo 1920×1080 WebP ≤ 400 KB); nome em snake_case; original preservado; registro no manifesto. Se não for possível inspecionar o arquivo, não aprovar.

## 13. Pendências e decisões para o diretor
- **[decisão do diretor]** Aceitar "pintura 2D com acabamento de gravura" como técnica única do jogo (esta bíblia assume que sim, como no mestre).
- **[decisão do diretor]** Luz da vela vinda da esquerda e câmera a ~20° como padrão fixo.
- **[decisão do diretor]** Uma imagem por relíquia, estados em código.
- Famílias visuais da tabela da seção 6 dependem das tags de D006 (thread 01). A moeda está como "neutra" até lá.
- Tipografia da UI é da thread 05 (UX); esta bíblia só exige que nenhum texto venha dentro de imagem.

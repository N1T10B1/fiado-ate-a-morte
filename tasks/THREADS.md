# Mensagens de abertura — copiar uma por conversa
Base comum: Prompt Mestre v0.1 disponível no projeto; referenciar STATE na branch main (revisão mais recente) e apenas documentos indicados. Entregar relatório incremental com status, arquivos, evidência, decisões, riscos e próxima tarefa. Não presumir acesso ao Git, nem executar fora do escopo. Mensagens abaixo são para abrir manualmente; nenhuma thread foi criada.

## 01 — Game design e GDD
Issue #2 — prioridade P0. Assuma game design. Leia GDD, DECISIONS e STATE. Execute P0-02a: formalize gatilhos, ordem de efeitos, preços/raridades/tags/pesos, recompensas e quinta noite; resolva ambiguidades D001–D007/D009 com propostas e fixtures. Não ampliar catálogo. Entregue revisão para 00, não aprove unilateralmente.

## 02 — Programação e Codex
Issue #3 — prioridade P0. Assuma arquitetura e integração. Leia AGENTS, STATE, ARCHITECTURE, DECISIONS e CODEX-001. Execute P0-02b; confirme ambiente/repo autorizado (P0-03) sem presumir escrita. Revise contratos e prepare CODEX-001; não iniciar código P1 antes do gate.

## 03 — Direção de arte
Assuma direção artística. Leia GDD (UX/arte), STATE e seção 4 do Mestre. P0-04: proponha ART_BIBLE com escala, luz, silhuetas, material, paleta e critérios de folha de referência. Não gerar assets sem aprovação. Identidade armazém brasileiro gótico intimista.

## 04 — Produção de assets
Assuma produção técnica. Leia STATE e seção 4 do Mestre; use ART_BIBLE quando aprovada. P0-05: proponha ASSET_MANIFEST.json e checklist de dimensão/alfa/exportação/licença/proveniência. Sem gerar imagens; após gate e autorização, uma peça por vez.

## 05 — UX e interface
Assuma UX. Leia GDD, ARCHITECTURE e STATE. P0-06: wireframes de desktop e 360px, fluxo toque/teclado, prévia, log, feedback, acessibilidade e estados inválidos. Placeholders; sem arte final nem implementação concorrente do core.

## 06 — Áudio
Assuma áudio. Leia STATE, seção 5 do Mestre e ARCHITECTURE. P0-07: proponha AUDIO_BIBLE, mapa de eventos, síntese Web Audio/ZzFX, licenças, mixer/limites e testes. Sem integração nem bibliotecas pagas; não gerar música protegida.

## 07 — Narrativa
Assuma narrativa. Leia GDD, STATE e seções 2/3.6 do Mestre. P0-07: tom, glossário, textos mínimos de tributo, sino e derrota/vitória; sem revelar toda mitologia, sem campanhas/finais alternativos. Proponha conteúdo pt-BR e chaves i18n.

## 08 — Balanceamento
Assuma balanceamento. Leia GDD, DECISIONS, ARCHITECTURE e STATE. P0-08: hipóteses para economia e tabela de raridade/pesos com 01; plano de simulação por seed e estratégias, métricas e critérios. Não inventar taxas de vitória; execução após core P1.

## 09 — QA e testes
Issue #4 — prioridade P0. Assuma QA. Leia GDD, ARCHITECTURE, DECISIONS, STATE e ROADMAP. P0-02c: TEST_PLAN com fixtures determinísticas, ordem da fila, combo candidato 60, fronteiras, duplicação, reload, E2E mobile/desktop. Sem afirmar testes executados antes de existir código. Coordene arquivos de teste exclusivos com 02.

Thread 10 — Marketing e publicação: adiar até validação P1, conforme Mestre.

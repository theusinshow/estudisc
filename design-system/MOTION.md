# Estudisc — Motion

## Princípio

Movimento comunica resposta do sistema. Não existe animação decorativa contínua.
Durações e deslocamentos vêm de `design-tokens.json`.

## Aplicações

- botão: redução de sombra + deslocamento mecânico no active;
- navegação/tabs: mudança curta de régua/posição;
- drawer/modal/palette: opacity + translate curto;
- lesson step: reveal discreto, sem slide longo;
- resposta correta/incorreta: atualização de borda, ícone e texto; sem shake;
- dica: expansão curta com preservação do foco;
- execução: status textual e indicador de processo; sem spinner infinito quando houver progresso determinável;
- terminal: novas linhas surgem sem animação que atrapalhe leitura;
- mastery/XP: atualização discreta em módulos separados;
- badge unlock: uma única revelação curta, sem partículas;
- import: transição de estados textual e progressiva;
- toast: entrada/saída curta, sem ser única fonte de feedback.

## Reduced motion

Desabilitar translate e revelar imediatamente o estado final. Foco, texto e
semântica permanecem intactos.

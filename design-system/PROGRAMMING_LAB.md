# Estudisc — Programming Lab

## Objetivo

Fornecer uma IDE educacional focada em experimentação, execução, debugging e
evidência pedagógica. A primeira runtime suportada é JavaScript em ambiente
isolado no navegador.

## Regra central

### RUN

- executa livremente;
- não cria Attempt oficial;
- não altera Mastery;
- não concede XP;
- mostra stdout, stderr, status e duração;
- pode ser usado repetidamente.

### SUBMIT SOLUTION

- executa validação e testes;
- cria Attempt imutável;
- registra código, saída, testes, duração e dicas usadas;
- pode alterar progresso/Mastery;
- pode conceder XP conforme regra pedagógica.

RUN e SUBMIT nunca compartilham o mesmo rótulo, atalho ou feedback.

## Layout desktop

- header: atividade, contexto e status;
- editor;
- output/terminal;
- testes/assertions;
- ações, separadas por régua;
- histórico de tentativas acessível sem sair da atividade.

## Layout responsivo

- desktop largo: editor e resultado lado a lado;
- desktop estreito/tablet: split ajustável ou painel empilhado;
- mobile: tabs exclusivas `CÓDIGO`, `SAÍDA`, `TESTES`; ação principal fixa apenas durante a atividade.

Código, terminal e diff podem usar overflow horizontal controlado. A interface
não força quebra que destrua significado técnico.

## Estados do editor

`ready`, `editing`, `draft`, `autosaved`, `running`, `syntax-error`,
`runtime-error`, `tests-failing`, `tests-passing`, `success`, `timeout`.

## Terminal

Canais:

- stdout;
- stderr;
- mensagem de sistema;
- processo iniciado/concluído;
- status de saída;
- saída do test runner.

Cada linha técnica usa prefixo visual/textual além de cor. Erros incluem tipo,
mensagem, arquivo/linha quando disponível e explicação pedagógica separada.

## Testes

Exibir:

- resultado geral;
- quantidade aprovada;
- cada assertion com nome;
- detalhes do primeiro erro relevante;
- testes ocultos identificados como ocultos, sem revelar implementação.

## Segurança e execução

- execução isolada em Web Worker ou sandbox equivalente;
- timeout obrigatório;
- sem acesso a cookies, storage sensível, rede ou APIs privilegiadas;
- captura controlada de `console`;
- limite de memória/saída quando possível;
- encerrar worker após execução.

## Acessibilidade

- editor compatível com teclado e screen reader conforme capacidade do editor adotado;
- alternativa de textarea simples quando necessário;
- terminal com `role="log"` e anúncios sem interromper digitação;
- atalhos documentados e configuráveis;
- não capturar atalhos globais sem aviso.

## Tentativas

Tentativas são append-only. Mostrar diff entre tentativa atual e anterior, tempo,
dicas usadas e resultado. RUNs livres podem ser descartados ou registrados apenas
como telemetria local; nunca contam como tentativa pedagógica.

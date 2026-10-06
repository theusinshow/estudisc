# Estudisc — Sistema de Cores

## Política de tema

Estudisc possui um tema editorial claro. Não existe dark mode completo.
`dimmedPaper` é uma preferência manual de conforto de leitura e não responde
automaticamente a `prefers-color-scheme`.

## Papéis

- `paper`: superfície principal de leitura;
- `panel`: agrupamento editorial;
- `desk`: fundo estrutural externo;
- `ink`: texto e estrutura principal;
- `dim`: conteúdo secundário quando houver contraste suficiente;
- `machine`: execução e saída técnica;
- `signal`: ação primária e estado atual, com uso contido;
- `accent.*`: acentos por área de produto, usados para orientar fluxo e seção,
  nunca como estado isolado;
- `success`, `warning`, `error`, `info`: reforço semântico, sempre acompanhados por texto/ícone.

## Contenção do signal

- uma CTA primária por contexto de decisão;
- item atual de navegação;
- foco editorial pontual;
- nunca colorir vários cards para “decorar”;
- não usar como sinônimo universal de sucesso.

## Acentos por área

Os acentos de área ajudam o usuário a reconhecer o tipo de trabalho em cada
superfície sem transformar a interface em tema multicolorido.

- `accent.onboarding`: primeiro uso, ativação de conteúdo e importação;
- `accent.learn`: trilhas, aulas, conceitos e mapa;
- `accent.practice`: prática, laboratório e atividades;
- `accent.review`: revisão espaçada;
- `accent.mistakes`: erros categorizados e recuperação;
- `accent.progress`: progresso, XP, rank e evidências;
- `accent.generation`: geração manual ou assistida por provedor.

Uso permitido: eyebrow, selo técnico, borda interna completa, fundo tintado
pontual e estados de agrupamento. Uso proibido: pintar cards inteiros de modo
decorativo, substituir `signal` em CTA primária, ou comunicar estado apenas por
cor.

## Superfície machine

Usada apenas quando o sistema executa, processa ou apresenta saída técnica:
editor, terminal, testes, code block, preview técnico e tooltip. Não aplicar em
páginas inteiras.

## Contraste

Cada combinação precisa ser testada contra os usos definidos. `dim` e estados
desabilitados não podem reduzir legibilidade abaixo do aceitável.

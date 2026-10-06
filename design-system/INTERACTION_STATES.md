# Estudisc — Estados de Interação

## Regra de comunicação

Nenhum estado depende só de cor. Todo estado usa ao menos um canal não cromático.
Estados críticos usam dois: texto + ícone, texto + forma, ou ícone + padrão.

## Estados globais

| Estado | Comunicação mínima |
|---|---|
| default | rótulo e anatomia normal |
| hover | mudança de borda/sombra e cursor; nunca informação exclusiva |
| focus-visible | anel canônico + manutenção do rótulo |
| active | deslocamento mecânico + mudança de sombra |
| disabled | atributo nativo, contraste reduzido e motivo disponível quando necessário |
| loading | texto de processo ou progressbar; bloquear duplicação |
| success | ícone, texto e região de status |
| warning | ícone, texto e orientação |
| error | ícone, título, causa e recuperação |
| empty | explicação + próxima ação |
| offline | badge textual persistente + descrição das limitações |
| syncing | status textual não bloqueante |
| saved | confirmação discreta, não apenas toast |

## Estados de aprendizagem

0. unseen — glifo vazio + rótulo.
1. introduced — glifo parcial + rótulo.
2. understood — glifo + evidência mínima.
3. practicing — glifo + rótulo + revisão/atividade disponível.
4. strong — glifo sólido + data da última evidência.
5. mastered — estrela + rótulo + evidências explicáveis.

`review-due` é um estado adicional e não substitui o nível de mastery.

## Estados de atividade

`idle`, `focused`, `answered`, `correct`, `incorrect`, `hint-1`, `hint-2`,
`hint-3`, `solution-viewed`, `completed`, `abandoned`, `resumed`, `review`.

- `incorrect` não usa shake nem linguagem punitiva.
- `abandoned` não é tentativa incorreta.
- `solution-viewed` fica registrado como evidência distinta de resolução autônoma.

## Estados de importação

`empty`, `parsing`, `validating`, `valid`, `invalid`, `duplicate`,
`update-available`, `conflict`, `importing`, `success`, `failed`.

Importação é atômica. Conflitos precisam ser resolvidos antes de aplicar.

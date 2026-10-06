# START HERE — Estudisc

## 1. Coloque o projeto em `C:\Dev`

Extraia o ZIP. O resultado deve ser:

```text
C:\Dev\pessoal\estudisc
```

## 2. Abra a pasta

```powershell
cd C:\Dev\pessoal\estudisc
```

## 3. Inicie o Git

```powershell
git init
git add .
git commit -m "chore: initialize Estudisc specification repository"
```

## 4. Abra no Cursor, caso queira

```powershell
code .
```

## 5. Inicie o Codex

```powershell
codex
```

No Codex, execute `/permissions` e confirme um modo automatizado limitado ao workspace do projeto. Evite acesso irrestrito ao computador.

Cole o conteúdo de `PROMPT-CODEX-START.md`.

O Codex deverá trabalhar em autonomia controlada: planejar, implementar, testar, corrigir, registrar checkpoints e avançar pelas fases aprovadas sem solicitar confirmação para cada ação local rotineira.

## Em caso de interrupção

Inicie uma nova sessão e cole `PROMPT-CODEX-RESUME.md`. O agente continuará a partir de `PROJECT_STATUS.md`, `PLANS.md` e `NEXT ACTION`.

## Ordem de leitura humana

1. `README.md`
2. `AUTONOMY.md`
3. `PROJECT_STATUS.md`
4. `docs/00-VISION.md`
5. `docs/02-SCOPE.md`
6. `docs/17-ROADMAP.md`
7. `design-system/DESIGN_SYSTEM_INDEX.md`

## Regra importante

O Design System v2.2 já está aprovado. Alterações visuais precisam respeitar sua ordem de precedência. O protótipo HTML é referência visual, não contrato normativo.

# PROMPT — MAESTRO / CODEX — APPLY VECTA GH

Você é o Maestro técnico responsável por integrar este pacote de Geografia + História no VECTA.

O conteúdo editorial já está produzido. NÃO pesquise novamente, NÃO reescreva aulas e NÃO regenere questões.

OBJETIVO
Integrar `VECTA-GH-CONTENT-IFSC-2027-1-v2` usando o mesmo padrão de importação que já funcionou para Ciências, com consumo mínimo de tokens.

FLUXO
1. Leia `IMPORT-MANIFEST.json`, `APPLY-TO-VECTA.md` e schemas de 3 aulas representativas.
2. Leia a memória técnica persistente do importer atual do VECTA; não reanalise o repositório inteiro se isso já foi documentado.
3. Reutilize os scripts/adapters/validators criados para Ciências sempre que possível.
4. Faça preflight dos pilotos: GH-02, GH-08, GH-15, GH-21, GH-24, GH-30, GH-44, GH-49.
5. Valide IDs, Concepts, blocks, 8 questões por aula, alternativas A–E e exatamente uma resposta correta.
6. Trate mídia em três pipelines separados:
   - `AUTHENTIC-MEDIA-QUEUE.json`: documentos/mapas/imagens reais; link/embutir só após licença/proveniência.
   - `DETERMINISTIC-ASSET-QUEUE.json`: mapas, timelines, gráficos e componentes exatos.
   - `ANTIGRAVITY-QUEUE.json`: apenas ilustrações conceituais não documentais.
7. Depois de PASS nos pilotos, importe em batches idempotentes.
8. Não marque tudo LIVE automaticamente; use estado de preview/import-ready.

REGRA CRÍTICA DE HISTÓRIA
Imagem de IA nunca pode ser apresentada como fotografia, documento ou evidência histórica.

TOKEN ECONOMY
AI constrói/corrige infraestrutura uma vez; código processa 49 aulas; AI analisa apenas exceções.

Ao final reporte apenas: lessons imported, questions imported, concepts mapped/created, media pending, deterministic assets pending, tests, blockers.

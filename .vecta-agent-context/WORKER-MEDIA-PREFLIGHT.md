# Science media preflight

Scope: read-only package inspection; no generation, paid services, research, editorial modification, approval or publication.

## Queue evidence
- Deterministic v2: declared 24, actual 24; all IMPLEMENTATION_REQUIRED; all mustNotFallbackToGeneratedImage=true.
- Antigravity v2: declared 13, actual 13; all PENDING_GENERATION; generator label ANTIGRAVITY_NANO_BANANA_2.
- Referenced lesson/source-pack files missing: 0.
- CIE-24 has no synthetic request; requires curated licensed institutional/community media.
- agy installation was reported in earlier status; no generation capability, authentication, model availability or executed output is verified by this worker.
- No existing approved assets were replaced. No media produced.
- SHA-256 DETERMINISTIC-ASSET-QUEUE.json: 69e8d025c96d9f3321415f5b057b7d01172e5f8401947dca44fb45a5171980dd
- SHA-256 ANTIGRAVITY-QUEUE.json: 1285e9426c3222feea61a3eda60a94a87fc215cda523ad7ea89d7421b5d1cbbd
- SHA-256 PROMPT-ANTIGRAVITY-BATCH.md: b63059876a03311a55be73bf742cc462055de1f1ce064f81c1e0e5fc187fd997

## Shapes
- Deterministic root: version/count/requests. Request: id, lessonId, title, type, description, mustNotFallbackToGeneratedImage, status, sourceRefs, conceptIds, acceptanceCriteria.
- Antigravity root: version/generator/count/policy/requests. Request: id, lessonId, blockId, generator, type, purpose, prompt, factualConstraints, forbiddenElements, aspectRatio, textInImage, altTextDraft, factualReviewStatus, visualReviewStatus, outputFilename, promptVersion, visualSystemRef, sourceRefs, conceptIds, reviewChecklist, status.

## Implementation outline and architecture escalation
- Reuse existing media blocks/renderers only through integrator contracts; application reuse is not verified here. PROJECT-CONTRACT and MEDIA-CONTRACT were pending architecture discovery at inspection. No repository-wide scan performed.
- Preserve facts/data separately from rendering; use mobile responsive SVG/HTML/data, accessible editable labels, keyboard controls, non-color distinctions and static fallback.
- Pilot order mandated by package: CIE-06, CIE-07, CIE-10, CIE-18, CIE-25, CIE-31, CIE-38, CIE-40. Pilot visual/functional QA precedes other deterministic requests.
- Read the exact corresponding lesson and SourcePack before implementation. Queue descriptions alone are not enough factual data for accurate implementation.
- Candidate reusable families: exact-count calculators (CIE-07/10/25/39); data tables (CIE-11/33); timelines/flows (CIE-09/17/18/27/30/34/40); deterministic diagrams (remaining requests). These are outlines, not approved implementations.
- CIE-15/16/29/31/32 require accurate reviewed vectors/geometry or licensed sources; CIE-11 requires reliable element data. Escalate missing factual inputs rather than inventing diagrams/data.
- Pack schema changes, new interaction types, rendering contracts and licensed-media ingestion are integrator decisions. Worker owns only later assigned execution/assets.
- Pending media must stay visibly pending in draft import; never claim GENERATED, FACTUAL_REVIEWED or APPROVED without evidence.

## Exact deterministic requirements
- COMP-CIE-06-001 (CIE-06): SVG de circuito simples com bateria, chave, lâmpada e fios; gerar versões aberto/fechado usando símbolos consistentes.
- COMP-CIE-07-001 (CIE-07): Componente calculadora de consumo: potência (W), tempo (h), resultado em kWh e explicação dimensional.
- COMP-CIE-08-001 (CIE-08): Diagrama de partículas para sólido/líquido/gás e setas de mudanças de estado; SVG, não imagem generativa.
- COMP-CIE-09-001 (CIE-09): Linha histórica esquemática Dalton → Thomson → Rutherford → Bohr; SVG com modelos explicitamente didáticos e não em escala.
- COMP-CIE-10-001 (CIE-10): Componente interativo do átomo mostrando Z, A, p, n, e e carga, ou embed PhET Monte um Átomo.
- COMP-CIE-11-001 (CIE-11): Tabela Periódica baseada em dados confiáveis; HTML/SVG, sem geração por imagem.
- COMP-CIE-13-001 (CIE-13): Diagrama vetorial de filtração, decantação e destilação simples, com labels renderizados pela VECTA.
- COMP-CIE-15-001 (CIE-15): Diagrama vetorial comparando célula procariótica, eucariótica animal e vegetal; labels separados do SVG-base quando possível.
- COMP-CIE-16-001 (CIE-16): Diagrama vetorial de organelas principais e fluxo conceitual de metabolismo; não usar IA generativa para anatomia celular precisa.
- COMP-CIE-17-001 (CIE-17): Diagrama DNA → gene → cromossomo; SVG com escalas declaradamente esquemáticas.
- COMP-CIE-18-001 (CIE-18): Linha temporal/diagrama de mitose vs meiose; componente determinístico para evitar fases incorretas.
- COMP-CIE-22-001 (CIE-22): Diagrama separado: efeito estufa vs camada de ozônio; SVG para impedir mistura conceitual.
- COMP-CIE-25-001 (CIE-25): Quadrado de Punnett interativo/determinístico; jamais gerado por imagem.
- COMP-CIE-27-001 (CIE-27): Árvore/classificação esquemática com HTML/SVG; sem sugerir árvore filogenética exata quando for apenas classificação escolar.
- COMP-CIE-29-001 (CIE-29): Mapa simplificado de sistemas do corpo humano com hotspots; usar ilustração licenciada ou vetor revisado, não anatomia generativa como fonte factual.
- COMP-CIE-30-001 (CIE-30): Fluxo vacina → antígeno → resposta → células de memória → resposta futura; SVG com labels da UI.
- COMP-CIE-31-001 (CIE-31): Diagrama óptico do olho, miopia e hipermetropia; SVG geométrico revisado.
- COMP-CIE-32-001 (CIE-32): Diagrama reprodutivo e linha do ciclo menstrual; usar recurso médico/licenciado ou desenho vetorial revisado, não IA generativa como autoridade.
- COMP-CIE-33-001 (CIE-33): Tabela comparativa de métodos contraceptivos e prevenção de IST; HTML/data, sem imagem generativa.
- COMP-CIE-34-001 (CIE-34): Timeline Lamarck / Darwin-Wallace / síntese moderna; usar retratos públicos/licenciados ou apenas texto + SVG.
- COMP-CIE-37-001 (CIE-37): Sistema Solar esquemático com aviso 'não está em escala'; preferir SVG/dados astronômicos.
- COMP-CIE-38-001 (CIE-38): Diagrama Terra-Lua-Sol para fases/eclipses e vetor de gravidade; SVG interativo.
- COMP-CIE-39-001 (CIE-39): Componente de escalas com potências de dez, UA e ano-luz; HTML/SVG.
- COMP-CIE-40-001 (CIE-40): Diagrama de evolução estelar por massa; SVG com duas trilhas principais e labels revisados.

## Exact Antigravity manual handoff
The following source prompt is preserved verbatim. This is a deferred manual handoff; no CLI command or model capability is claimed.
Source: .local/science-package/VECTA-SCIENCE-CONTENT-v2/MEDIA-PRODUCTION/PROMPT-ANTIGRAVITY-BATCH.md

# Prompt — VECTA Science Image Producer / Antigravity

You are the image-production worker for the VECTA Science content pack.

## Read first
1. `MEDIA-PRODUCTION/VISUAL-SYSTEM.md`
2. `MEDIA-PRODUCTION/ANTIGRAVITY-QUEUE.json`
3. For each request, the corresponding `workspace/CIE-XX/research/source-pack.json`
4. The corresponding `workspace/CIE-XX/author/lesson.json`

## Task
Process only requests whose `status` is `PENDING_GENERATION`.

For each request:
1. verify its factual constraints against the SourcePack;
2. generate a single strong candidate using Antigravity image generation / Nano Banana 2;
3. inspect the image for obvious artifacts and regenerate only if clearly defective;
4. save the selected asset under:
   `workspace/CIE-XX/media/generated/<outputFilename>`;
5. create a sidecar metadata JSON with the same basename:
   - requestId
   - lessonId
   - generatedAt
   - generator/model actually used
   - final prompt
   - sourceRefs
   - factualConstraints
   - altText
   - sha256 if practical
   - visualReviewStatus: `GENERATED`
   - factualReviewStatus: `PENDING`
6. update a local media manifest without changing lesson editorial content.

## Hard rules
- Never add labels, equations or factual text inside an image unless the request explicitly requires it.
- Never replace a deterministic asset request with a generated image.
- Never generate cultural stereotypes. CIE-24 must use curated real sources, not synthetic people.
- Never mark an image APPROVED.
- Never modify questions, Concepts, curriculum or lesson prose.
- Do not generate assets for lessons without a listed request.
- Preserve existing approved assets and create a new version instead of overwriting them.

## Completion report
Return:
- generated count;
- regenerated count;
- failed count;
- files created;
- requests requiring factual review;
- any request you refused because a deterministic/real-source asset is more appropriate.

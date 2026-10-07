import {
  codeBlockSchema,
  conceptBlockSchema,
  figureBlockSchema,
  textBlockSchema,
  titledTextBlockSchema,
  type CodeBlockPayload,
  type TextBlockPayload,
  type TitledTextBlockPayload
} from "@/features/lessons/blocks/block-schemas";
import { Paragraphs } from "@/components/ui/paragraphs";
import { NumericExplorer } from "./numeric-explorer";
import { AtomModel } from "./atom-model";
import { atomModelSchema } from "./atom-model-schema";
import { numericExplorerSchema } from "./numeric-explorer-schema";
import { educationalActivitySchema } from "@/features/activities/application/educational-activity";
import { EducationalActivityPanel } from "@/features/activities/components/educational-activity-panel";
import { PredictionPanel } from "./prediction-panel";
import { getFeatureFlags } from "@/lib/feature-flags";
import { SafeFigure } from "./safe-figure";
import { ComparisonFigure } from "./comparison-figure";
import { HotspotImage, AuthoredMap } from "./visual-locations";
import { hotspotSchema, authoredMapSchema, type HotspotConfig } from "./visual-interactions-schema";
import type { ImportedLessonBlock, LessonBlockRendererProps } from "@/features/lessons/blocks/types";

type BlockRenderer = (block: ImportedLessonBlock) => React.ReactNode;

const blockRenderers: Readonly<Record<string, BlockRenderer>> = {
  text: renderTextBlock,
  code: renderCodeBlock,
  concept: renderConceptBlock,
  note: renderNoteBlock,
  warning: renderWarningBlock,
  example: renderExampleBlock,
  prediction: renderPredictionBlock,
  summary: renderSummaryBlock,
  "worked-example": renderExampleBlock,
  "numeric-explorer": renderNumericExplorer,
  "guided-steps": renderEducationalBlock,
  "text-highlight": renderEducationalBlock,
  classification: renderEducationalBlock,
  ordering: renderEducationalBlock,
  matching: renderEducationalBlock
  ,diagram:renderDiagram,timeline:renderTimeline,
  figure: renderFigureBlock,
  hotspot: renderLocationBlock,
  map: renderLocationBlock
};
function renderDiagram(block:ImportedLessonBlock){const parsed=atomModelSchema.safeParse(block.payload);return parsed.success?<AtomModel {...parsed.data} interaction={{target:"block",id:block.stableId}}/>:<InvalidBlock block={block}/>;}
function renderTimeline(block:ImportedLessonBlock){const raw=typeof block.payload==="object"&&block.payload!==null?block.payload:{};return renderEducationalBlock({...block,payload:{...raw,type:"ordering"}});}

// ADR 0032: the data URI renders through <img>, so SVG scripts can never execute; the text equivalent is a disclosure.
function renderFigureBlock(block: ImportedLessonBlock) {
  const payload = typeof block.payload === "object" && block.payload !== null ? block.payload : {};
  const parsed = figureBlockSchema.safeParse({ type: block.type, ...payload });
  if (!parsed.success) return <InvalidBlock block={block} />;
  const figure = parsed.data;
  return figure.comparison && getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? <ComparisonFigure figure={figure} interaction={{ target: "block", id: block.stableId }}/> : <SafeFigure figure={figure}/>;
}
function renderLocationBlock(block: ImportedLessonBlock) {
  const payload = typeof block.payload === "object" && block.payload !== null ? block.payload : {};
  if (block.type === "map") {
    const parsed = authoredMapSchema.safeParse({ type: block.type, ...payload }); if (!parsed.success) return <InvalidBlock block={block}/>;
    return getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? <AuthoredMap config={parsed.data} interaction={{ target: "block", id: block.stableId }}/> : renderLocationFallback(parsed.data);
  }
  const parsed = hotspotSchema.safeParse({ type: block.type, ...payload }); if (!parsed.success) return <InvalidBlock block={block}/>;
  return getFeatureFlags().FEATURE_INTERACTIVE_LESSONS ? <HotspotImage config={parsed.data} interaction={{ target: "block", id: block.stableId }}/> : renderLocationFallback(parsed.data);
}
function renderLocationFallback(config: HotspotConfig) {
  return <div><SafeFigure figure={config}/><dl>{config.points.map(point => <div key={point.id}><dt>{point.label}</dt><dd><Paragraphs text={point.description}/></dd></div>)}</dl></div>;
}

function renderNumericExplorer(block: ImportedLessonBlock) {
  const parsed = numericExplorerSchema.safeParse(block.payload);
  return parsed.success ? <NumericExplorer {...parsed.data} interaction={{ target: "block", id: block.stableId }} enhanced={getFeatureFlags().FEATURE_INTERACTIVE_LESSONS}/> : <InvalidBlock block={block} />;
}
function renderEducationalBlock(block: ImportedLessonBlock) {
  const parsed = educationalActivitySchema.safeParse(block.payload);
  const payload = block.payload as { title?: unknown };
  return parsed.success ? <EducationalActivityPanel prompt={typeof payload.title === "string" ? payload.title : "Pratique este passo"} config={parsed.data} interaction={{ target: "block", id: block.stableId }} /> : <InvalidBlock block={block} />;
}

export function LessonBlockList({ blocks }: Readonly<{ blocks: ReadonlyArray<ImportedLessonBlock> }>) {
  return (
    <div className="lesson-blocks">
      {blocks.map((block) => (
        <LessonBlockRenderer block={block} key={block.stableId} />
      ))}
    </div>
  );
}

export function LessonBlockRenderer({ block }: LessonBlockRendererProps) {
  const renderer = blockRenderers[block.type] ?? renderUnsupportedBlock;
  const payload = block.payload;
  const needsEnvelopeType = ["text", "code", "concept", "note", "warning", "example", "worked-example", "prediction", "summary"].includes(block.type);
  const readable = needsEnvelopeType && payload && typeof payload === "object" && !Array.isArray(payload) && !("type" in payload)
    ? { ...block, payload: { ...payload, type: block.type } } : block;
  return renderer(readable);
}

function renderTextBlock(block: ImportedLessonBlock) {
  const parsed = textBlockSchema.safeParse(block.payload);

  if (!parsed.success) {
    return <InvalidBlock block={block} />;
  }

  return <TextBlock payload={parsed.data} />;
}

function renderCodeBlock(block: ImportedLessonBlock) {
  const parsed = codeBlockSchema.safeParse(block.payload);

  if (!parsed.success) {
    return <InvalidBlock block={block} />;
  }

  return <CodeBlock payload={parsed.data} />;
}

function renderConceptBlock(block: ImportedLessonBlock) {
  const parsed = conceptBlockSchema.safeParse(block.payload);

  if (!parsed.success) {
    return <InvalidBlock block={block} />;
  }

  return (
    <BlockShell label="Conceito" variant="concept">
      <strong>{parsed.data.title ?? parsed.data.conceptId ?? "Conceito importado"}</strong>
      {parsed.data.content ? <Paragraphs text={parsed.data.content} /> : null}
    </BlockShell>
  );
}

function renderNoteBlock(block: ImportedLessonBlock) {
  return renderTitledTextBlock(block, "Nota", "note");
}

function renderWarningBlock(block: ImportedLessonBlock) {
  return renderTitledTextBlock(block, "Atenção", "warning");
}

function renderExampleBlock(block: ImportedLessonBlock) {
  return renderTitledTextBlock(block, "Exemplo", "example");
}

function renderPredictionBlock(block: ImportedLessonBlock) {
  if (getFeatureFlags().FEATURE_INTERACTIVE_LESSONS) {
    const parsed = titledTextBlockSchema.safeParse(block.payload), extra = block.payload as { observation?: unknown; explanation?: unknown };
    if (!parsed.success) return <InvalidBlock block={block}/>;
    return <PredictionPanel title={parsed.data.title ?? "Antes de observar"} prompt={parsed.data.content} observation={typeof extra.observation === "string" ? extra.observation : undefined} explanation={typeof extra.explanation === "string" ? extra.explanation : undefined} interaction={{ target: "block", id: block.stableId }}/>;
  }
  return renderTitledTextBlock(block, "Predição", "prediction");
}

function renderSummaryBlock(block: ImportedLessonBlock) {
  return renderTitledTextBlock(block, "Resumo", "summary");
}

function renderTitledTextBlock(block: ImportedLessonBlock, label: string, variant: string) {
  const parsed = titledTextBlockSchema.safeParse(block.payload);

  if (!parsed.success) {
    return <InvalidBlock block={block} />;
  }

  return <TitledTextBlock label={label} payload={parsed.data} variant={variant} />;
}

function renderUnsupportedBlock(block: ImportedLessonBlock) {
  return (
    <BlockShell label="Bloco importado" variant="unsupported">
      <strong>{block.type}</strong>
      <p>Este tipo de bloco ainda não possui renderer aprovado nesta fase.</p>
    </BlockShell>
  );
}

function TextBlock({ payload }: Readonly<{ payload: TextBlockPayload }>) {
  return <div className="lesson-text"><Paragraphs text={payload.content} /></div>;
}

function CodeBlock({ payload }: Readonly<{ payload: CodeBlockPayload }>) {
  return (
    <figure className="machine-block-figure">
      <figcaption>{payload.language}</figcaption>
      <pre className="machine-block">
        <code>{payload.code}</code>
      </pre>
    </figure>
  );
}

function TitledTextBlock({
  label,
  payload,
  variant
}: Readonly<{
  label: string;
  payload: TitledTextBlockPayload;
  variant: string;
}>) {
  return (
    <BlockShell label={label} variant={variant}>
      {payload.title ? <strong>{payload.title}</strong> : null}
      <Paragraphs text={payload.content} />
    </BlockShell>
  );
}

function InvalidBlock({ block }: Readonly<{ block: ImportedLessonBlock }>) {
  return (
    <BlockShell label="Bloco inválido" variant="invalid">
      <strong>{block.type}</strong>
      <p>O payload importado não corresponde ao contrato do renderer.</p>
    </BlockShell>
  );
}

function BlockShell({
  children,
  label,
  variant
}: Readonly<{
  children: React.ReactNode;
  label: string;
  variant: string;
}>) {
  return (
    <section className="lesson-callout" data-variant={variant} aria-label={label}>
      <span className="lesson-callout-label">{label}</span>
      <div>{children}</div>
    </section>
  );
}

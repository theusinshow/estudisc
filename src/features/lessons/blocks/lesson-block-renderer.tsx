import {
  codeBlockSchema,
  conceptBlockSchema,
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
  ,diagram:renderDiagram,timeline:renderTimeline
};
function renderDiagram(block:ImportedLessonBlock){const parsed=atomModelSchema.safeParse(block.payload);return parsed.success?<AtomModel {...parsed.data}/>:<InvalidBlock block={block}/>;}
function renderTimeline(block:ImportedLessonBlock){const raw=typeof block.payload==="object"&&block.payload!==null?block.payload:{};return renderEducationalBlock({...block,payload:{...raw,type:"ordering"}});}

function renderNumericExplorer(block: ImportedLessonBlock) {
  const parsed = numericExplorerSchema.safeParse(block.payload);
  return parsed.success ? <NumericExplorer {...parsed.data} /> : <InvalidBlock block={block} />;
}
function renderEducationalBlock(block: ImportedLessonBlock) {
  const parsed = educationalActivitySchema.safeParse(block.payload);
  const payload = block.payload as { title?: unknown };
  return parsed.success ? <EducationalActivityPanel prompt={typeof payload.title === "string" ? payload.title : "Pratique este passo"} config={parsed.data} /> : <InvalidBlock block={block} />;
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

  return renderer(block);
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

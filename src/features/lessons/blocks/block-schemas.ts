import { z } from "zod";

const baseBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string()
});

export const textBlockSchema = baseBlockSchema.extend({
  content: z.string().min(1)
});

export const codeBlockSchema = baseBlockSchema.extend({
  language: z.string().default("text"),
  code: z.string().min(1)
});

export const titledTextBlockSchema = baseBlockSchema.extend({
  title: z.string().optional(),
  content: z.string().min(1)
});

export const conceptBlockSchema = baseBlockSchema.extend({
  conceptId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional()
});

export type TextBlockPayload = z.infer<typeof textBlockSchema>;
export type CodeBlockPayload = z.infer<typeof codeBlockSchema>;
export type TitledTextBlockPayload = z.infer<typeof titledTextBlockSchema>;
export type ConceptBlockPayload = z.infer<typeof conceptBlockSchema>;

// ADR 0032: authored lesson figures travel inside the Pack as data URIs and render only through <img>.
export const FIGURE_MAX_BYTES = 200_000;
const FIGURE_DATA_URI = /^data:image\/(svg\+xml|png|webp|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const UNSAFE_SVG = /<script|<foreignObject|\son[a-z]+\s*=|javascript:|(?:xlink:)?href\s*=\s*["'](?!#)/i;

export function inspectFigureSource(src: string): string | null {
  const match = FIGURE_DATA_URI.exec(src);
  if (!match) return "Figure source must be a base64 data URI of SVG, PNG, WebP or JPEG";
  let binary: string;
  try { binary = atob(match[2]); } catch { return "Invalid figure base64"; }
  if (binary.length > FIGURE_MAX_BYTES) return `Figure exceeds ${FIGURE_MAX_BYTES} bytes`;
  if (match[1] === "svg+xml" && UNSAFE_SVG.test(binary)) return "SVG figure contains scripts, handlers or external references";
  return null;
}

export const figureSourceSchema = z.string().superRefine((src, context) => {
    const problem = inspectFigureSource(src);
    if (problem) context.addIssue({ code: "custom", message: problem });
  });
const comparisonSchema = z.object({ src: figureSourceSchema, alt: z.string().trim().min(12), caption: z.string().trim().min(1), longDescription: z.string().trim().min(1), credit: z.string().trim().min(1).optional() }).strict();
export const figureBlockSchema = baseBlockSchema.extend({
  src: figureSourceSchema,
  alt: z.string().trim().min(12),
  caption: z.string().trim().min(1),
  credit: z.string().trim().min(1).optional(),
  longDescription: z.string().trim().min(1).optional(),
  width: z.number().int().positive().max(4000),
  height: z.number().int().positive().max(4000),
  comparison: comparisonSchema.optional()
});

export type FigureBlockPayload = z.infer<typeof figureBlockSchema>;

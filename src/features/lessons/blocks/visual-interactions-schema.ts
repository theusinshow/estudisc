import { z } from "zod";
import { figureBlockSchema } from "./block-schemas";

const point = z.object({ id: z.string().min(1).max(160), label: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(2000), x: z.number().int().min(0).max(100), y: z.number().int().min(0).max(100) }).strict();
const points = z.array(point).min(1).max(30).refine(points => new Set(points.map(point => point.id)).size === points.length, "Duplicate point ID");
export const hotspotSchema = figureBlockSchema.extend({ title: z.string().min(1).default("Explore a imagem"), points }).superRefine((data, context) => { if (data.comparison) context.addIssue({ code: "custom", message: "Hotspot and comparison are separate interactions" }); });
export const authoredMapSchema = figureBlockSchema.extend({ title: z.string().min(1).default("Explore os locais"), coordinateSystem: z.literal("image-percent"), points }).superRefine((data, context) => { if (data.comparison) context.addIssue({ code: "custom", message: "Map and comparison are separate interactions" }); });
export type HotspotConfig = z.infer<typeof hotspotSchema>;
export type AuthoredMapConfig = z.infer<typeof authoredMapSchema>;

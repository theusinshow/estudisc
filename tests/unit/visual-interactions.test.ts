import { expect, it } from "vitest";
import { figureBlockSchema, inspectFigureSource } from "@/features/lessons/blocks/block-schemas";
import { authoredMapSchema, hotspotSchema } from "@/features/lessons/blocks/visual-interactions-schema";
import { validInteractionState } from "@/features/lessons/interaction-policy";
import { validateTrackPack } from "@/features/import/application/track-pack-validation";
import { comparison, figure, hotspot, interactivePack, map } from "../fixtures/interactive-blocks";

it("validates comparison and declared map/hotspot payloads through the existing Pack boundary", () => {
  expect(figureBlockSchema.safeParse(figure).success).toBe(true);
  expect(figureBlockSchema.safeParse(comparison).success).toBe(true);
  expect(hotspotSchema.safeParse(hotspot).success).toBe(true);
  expect(authoredMapSchema.safeParse(map).success).toBe(true);
  const validated = validateTrackPack(interactivePack());
  expect(validated.ok, validated.ok ? undefined : JSON.stringify(validated.issues)).toBe(true);
});
it("fails safely for malformed images, external URLs, duplicate/unknown points and ambiguous modes", () => {
  expect(inspectFigureSource("data:image/png;base64,A")).toBe("Invalid figure base64");
  expect(figureBlockSchema.safeParse({ ...comparison, comparison: { ...comparison.comparison, src: "https://example.com/asset.svg" } }).success).toBe(false);
  expect(hotspotSchema.safeParse({ ...hotspot, points: [hotspot.points[0], hotspot.points[0]] }).success).toBe(false);
  expect(hotspotSchema.safeParse({ ...hotspot, points: [{ ...hotspot.points[0], x: 10.5 }] }).success).toBe(false);
  expect(authoredMapSchema.safeParse({ ...map, coordinateSystem: "latitude-longitude" }).success).toBe(false);
  expect(hotspotSchema.safeParse({ ...hotspot, comparison: comparison.comparison }).success).toBe(false);
  expect(validInteractionState({ target: "block", id: "hot", type: "hotspot", config: hotspot }, { target: "block", id: "hot", kind: "hotspot", state: { selectedId: "unknown", zoom: 1 } })).toBe(false);
});

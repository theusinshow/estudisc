import { describe, expect, it } from "vitest";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { resolveLessonVersionContext } from "@/features/import/application/lesson-version-policy";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";

const svg = (body: string) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">${body}</svg>`).toString("base64")}`;
const safe = svg(`<rect width="100" height="60" fill="#fff4e0"/><circle cx="50" cy="30" r="20" fill="#17141f"/>`);
const visual = (type: string, extra: Record<string, unknown> = {}) => ({
  type, src: safe, alt: "Esquema didático de um círculo escuro sobre fundo claro.", caption: "Esquema didático.",
  credit: "Estudisc (ilustração original)", longDescription: "Um círculo escuro aparece no centro de um retângulo claro.", width: 100, height: 60, ...extra
});

function attempt(payload: Record<string, unknown>) {
  const { context, base, packet } = lessonVersionFixture();
  const lesson = structuredClone({ ...base, version: base.version + 1, status: "draft" as const });
  lesson.blocks.push({ id: `${base.id}-VISUAL-01`, type: payload.type, schemaVersion: 1, conceptIds: [base.concepts[0].id], payload } as never);
  return () => resolveLessonVersionContext([context], lessonVersionPackSchema.parse({ ...packet, packId: "estudisc.visual.test", lesson, target: { ...packet.target, baseHash: hashCanonicalJson(base) } }));
}

describe("visual additions to a published lesson", () => {
  it("accepts a safe figure with credit and long description", () => {
    expect(attempt(visual("figure"))).not.toThrow();
  });
  it("accepts an interactive map with points", () => {
    expect(attempt(visual("map", { title: "Explore os locais", coordinateSystem: "image-percent", points: [{ id: "p1", label: "Centro", description: "Ponto central do esquema.", x: 50, y: 50 }] }))).not.toThrow();
  });
  it("rejects a figure without credit or long description", () => {
    expect(attempt(visual("figure", { credit: undefined }))).toThrow("An added visual needs");
    expect(attempt(visual("figure", { longDescription: undefined }))).toThrow("An added visual needs");
  });
  it("rejects an SVG with script or external reference", () => {
    expect(attempt(visual("figure", { src: svg(`<script>alert(1)</script>`) }))).toThrow("An added visual needs");
    expect(attempt(visual("figure", { src: svg(`<image href="https://example.com/x.png"/>`) }))).toThrow("An added visual needs");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LessonBlockList } from "@/features/lessons/blocks";
import { FIGURE_MAX_BYTES, figureBlockSchema } from "@/features/lessons/blocks/block-schemas";

const svg = (body: string) => `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`)}`;
const valid = { type: "figure", src: svg('<defs><marker id="a"/></defs><use href="#a"/><rect width="10" height="10"/>'), alt: "Alavanca com apoio no meio", caption: "Alavanca interfixa", width: 320, height: 200 };

describe("figure block (ADR 0032)", () => {
  it("accepts embedded SVG with internal references and raster data URIs", () => {
    expect(figureBlockSchema.safeParse(valid).success).toBe(true);
    expect(figureBlockSchema.safeParse({ ...valid, src: `data:image/png;base64,${btoa("png-bytes")}` }).success).toBe(true);
  });

  it.each([
    ["an external URL", "https://example.com/a.svg"],
    ["a script", svg("<script>alert(1)</script>")],
    ["an event handler", svg('<rect onload="alert(1)"/>')],
    ["an external reference", svg('<image href="https://example.com/x.png"/>')],
    ["a javascript URL", svg('<a href="javascript:alert(1)"><rect/></a>')],
    ["foreignObject", svg("<foreignObject><div/></foreignObject>")]
  ])("rejects a source with %s", (_label, src) => {
    expect(figureBlockSchema.safeParse({ ...valid, src }).success).toBe(false);
  });

  it("rejects oversized images and missing accessible text", () => {
    expect(figureBlockSchema.safeParse({ ...valid, src: `data:image/png;base64,${btoa("x".repeat(FIGURE_MAX_BYTES + 1))}` }).success).toBe(false);
    expect(figureBlockSchema.safeParse({ ...valid, alt: "figura" }).success).toBe(false);
  });

  it("renders the image, caption, credit and text equivalent", () => {
    render(<LessonBlockList blocks={[{ stableId: "fig", type: "figure", payload: { ...valid, credit: "Ilustração própria", longDescription: "Barra rígida apoiada no meio." } }]} />);
    expect(screen.getByRole("img", { name: valid.alt })).toHaveAttribute("src", valid.src);
    expect(screen.getByText("Alavanca interfixa")).toBeInTheDocument();
    expect(screen.getByText("Ilustração própria")).toBeInTheDocument();
    expect(screen.getByText("Descrição da imagem")).toBeInTheDocument();
  });
});

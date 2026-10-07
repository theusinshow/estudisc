import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LessonBlockList, LessonBlockRenderer } from "@/features/lessons/blocks";

describe("LessonBlockRenderer", () => {
  it.each(["text", "worked-example", "prediction", "summary"])("reads the %s envelope type without rewriting canonical payloads", type => {
    const payload = Object.freeze({ content: "Canonical authored text" });
    render(<LessonBlockRenderer block={{ stableId: "outer-typed", type, payload }}/>);
    expect(screen.getByText("Canonical authored text")).toBeInTheDocument();
    expect(payload).toEqual({ content: "Canonical authored text" });
  });
  it("does not replace an explicitly invalid payload type or missing content", () => {
    render(<LessonBlockList blocks={[
      { stableId: "invalid-type", type: "worked-example", payload: { type: 42, content: "Invalid" } },
      { stableId: "invalid-content", type: "prediction", payload: {} }
    ]}/>);
    expect(screen.getAllByRole("region", { name: "Bloco inválido" })).toHaveLength(2);
  });
  it("renders allowlisted text and code blocks from imported payloads", () => {
    render(
      <LessonBlockList
        blocks={[
          {
            stableId: "intro",
            type: "text",
            payload: {
              id: "intro",
              type: "text",
              content: "Texto importado"
            }
          },
          {
            stableId: "code",
            type: "code",
            payload: {
              id: "code",
              type: "code",
              language: "javascript",
              code: "const value = 1;"
            }
          }
        ]}
      />
    );

    expect(screen.getByText("Texto importado")).toBeInTheDocument();
    expect(screen.getByText("javascript")).toBeInTheDocument();
    expect(screen.getByText("const value = 1;")).toBeInTheDocument();
  });

  it("renders semantic callouts without executing arbitrary payloads", () => {
    render(
      <LessonBlockRenderer
        block={{
          stableId: "warning",
          type: "warning",
          payload: {
            id: "warning",
            type: "warning",
            title: "Cuidado",
            content: "Estado não depende só de cor.",
            component: "<script>alert(1)</script>"
          }
        }}
      />
    );

    expect(screen.getByLabelText("Atenção")).toHaveTextContent("Cuidado");
    expect(screen.getByLabelText("Atenção")).toHaveTextContent("Estado não depende só de cor.");
    expect(screen.queryByText(/script/)).not.toBeInTheDocument();
  });

  it("keeps unsupported and invalid blocks visible as safe status content", () => {
    const { rerender } = render(
      <LessonBlockRenderer
        block={{
          stableId: "unsupported-diagram",
          type: "unsupported-diagram",
          payload: {
            id: "unsupported-diagram",
            type: "unsupported-diagram",
            nodes: []
          }
        }}
      />
    );

    expect(screen.getByLabelText("Bloco importado")).toHaveTextContent("unsupported-diagram");
    expect(screen.getByLabelText("Bloco importado")).toHaveTextContent("ainda não possui renderer aprovado");

    rerender(
      <LessonBlockRenderer
        block={{
          stableId: "bad-text",
          type: "text",
          payload: {
            id: "bad-text",
            type: "text"
          }
        }}
      />
    );

    expect(screen.getByLabelText("Bloco inválido")).toHaveTextContent("payload importado");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ComparisonFigure } from "@/features/lessons/blocks/comparison-figure";
import { HotspotImage, AuthoredMap } from "@/features/lessons/blocks/visual-locations";
import { hotspotSchema, authoredMapSchema } from "@/features/lessons/blocks/visual-interactions-schema";
import { comparison, hotspot, map } from "../fixtures/interactive-blocks";

it("supports comparison with buttons, keyboard slider and an independent text equivalent", async () => {
  const user = userEvent.setup(); render(<ComparisonFigure figure={comparison} interaction={{ target: "block", id: "compare" }}/>);
  await user.click(screen.getByRole("button", { name: "Mostrar antes" })); expect(screen.getByRole("slider")).toHaveValue("0");
  await user.click(screen.getByRole("button", { name: "Mostrar depois" })); expect(screen.getByRole("slider")).toHaveValue("100");
  expect(screen.getAllByText(comparison.comparison.longDescription)[0]).toBeVisible();
});
it("keeps hotspot locations accessible when the image fails and supports zoom without drag", async () => {
  const user = userEvent.setup(); render(<HotspotImage config={hotspotSchema.parse(hotspot)} interaction={{ target: "block", id: "hot" }}/>);
  fireEvent.error(screen.getByRole("img"));
  await user.click(screen.getByRole("button", { name: "2. Local B" }));
  expect(screen.getByRole("status")).toHaveTextContent("Descrição do local B");
  expect(screen.queryByRole("button", { name: "Explorar Local B" })).toBeNull();
  expect(screen.getByRole("button", { name: "Tentar carregar imagem" })).toBeVisible();
});
it("provides an offline map location list without requesting a geographic provider", async () => {
  const user = userEvent.setup(); render(<AuthoredMap config={authoredMapSchema.parse(map)} interaction={{ target: "block", id: "map" }}/>);
  await user.click(screen.getByRole("button", { name: "1. Local A" }));
  expect(screen.getByRole("status")).toHaveTextContent("Descrição do local A");
});

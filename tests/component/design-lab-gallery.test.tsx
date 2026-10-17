import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { LabGallery } from "@/features/design-lab/lab-gallery";

it("shows every lab section with the four subjects", () => {
  render(<LabGallery sample={null} />);
  for (const heading of ["Botões e filtros", "Matérias", "Questão", "Leitura", "Estado vazio"]) {
    expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
  }
  for (const subject of ["Matemática", "Ciências", "Português", "Geografia e História"]) {
    expect(screen.getByText(subject)).toBeTruthy();
  }
});

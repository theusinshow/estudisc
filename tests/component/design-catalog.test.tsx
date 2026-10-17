import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { AnswersBlock } from "@/features/design-lab/catalog/answers";
import { CardsBlock } from "@/features/design-lab/catalog/cards";
import { ControlsBlock } from "@/features/design-lab/catalog/controls";
import { FeedbackBlock } from "@/features/design-lab/catalog/feedback";
import { FoundationsBlock } from "@/features/design-lab/catalog/foundations";
import { MotionBlock } from "@/features/design-lab/catalog/motion";

it("renders every catalog block with addressable item codes", () => {
  render(<><FoundationsBlock /><ControlsBlock /><CardsBlock /><AnswersBlock /><FeedbackBlock /><MotionBlock /></>);
  for (const title of ["Fundamentos", "Controles", "Cards", "Questão e resposta", "Feedback e navegação", "Movimento"]) {
    expect(screen.getByRole("heading", { level: 2, name: new RegExp(title) })).toBeTruthy();
  }
  for (const code of ["1.1", "1.10", "2.6", "3-A", "3-D", "4-A", "4-D", "4.6", "5.7", "6.1", "6.8"]) {
    expect(screen.getByText(code, { selector: ".dc-code" })).toBeTruthy();
  }
});

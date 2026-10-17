import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { AnswersBlock } from "@/features/design-lab/catalog/answers";
import { CardsBlock } from "@/features/design-lab/catalog/cards";
import { ControlsBlock } from "@/features/design-lab/catalog/controls";
import { FeedbackBlock } from "@/features/design-lab/catalog/feedback";
import { FoundationsBlock } from "@/features/design-lab/catalog/foundations";
import { IdeasBlock } from "@/features/design-lab/catalog/ideas/block";
import { IdeasTwoBlock } from "@/features/design-lab/catalog/ideas2/block";
import { InteractiveBlock } from "@/features/design-lab/catalog/interactive";
import { MotionBlock } from "@/features/design-lab/catalog/motion";

it("renders every catalog block with addressable item codes", () => {
  render(<><FoundationsBlock /><ControlsBlock /><CardsBlock /><AnswersBlock /><FeedbackBlock /><MotionBlock /><InteractiveBlock /><IdeasBlock /><IdeasTwoBlock /></>);
  for (const title of ["Fundamentos", "Controles", "Cards", "Questão e resposta", "Feedback e navegação", "Movimento", "Interações ao vivo", "Estudar mexendo", "Mais ideias"]) {
    expect(screen.getByRole("heading", { level: 2, name: new RegExp(title) })).toBeTruthy();
  }
  for (const code of ["1.1", "1.10", "2.6", "3.1", "3.2", "4.1", "4.4", "5.7", "6.1", "6.8", "7.1", "7.6", "8.1", "8.5", "8.10", "8.13", "9.1", "9.8", "9.13"]) {
    expect(screen.getByText(code, { selector: ".dc-code" })).toBeTruthy();
  }
});

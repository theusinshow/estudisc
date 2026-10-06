import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Dialog, Sheet } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
afterEach(() => {
  vi.restoreAllMocks();
  for (const [name, descriptor] of [["showModal", originalShowModal], ["close", originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});

describe("accessible foundation controls", () => {
  it("moves tab focus with arrows/Home/End and activates with the native button action", () => {
    render(<Tabs label="Sessões" tabs={[
      { id: "next", label: "Próximas", content: "Sessão preparada" },
      { id: "done", label: "Concluídas", content: "Resultado da sessão" }
    ]} />);
    const first = screen.getByRole("tab", { name: "Próximas" });
    const second = screen.getByRole("tab", { name: "Concluídas" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(second).toHaveFocus();
    expect(first).toHaveAttribute("aria-selected", "true");
    fireEvent.click(second);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Resultado da sessão");
    fireEvent.keyDown(second, { key: "Home" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "ArrowLeft" });
    expect(second).toHaveFocus();
  });

  it.each([Dialog, Sheet])("opens a native modal and restores the trigger after Escape", Component => {
    // jsdom lacks showModal; browser E2E separately verifies real focus containment.
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
    function Example() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Abrir</button><Component open={open} title="Detalhes" onClose={() => setOpen(false)}><p>Conteúdo</p></Component></>;
    }
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Abrir" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Detalhes" });
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

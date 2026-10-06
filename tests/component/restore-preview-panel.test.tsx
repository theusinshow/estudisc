import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RestorePreviewPanel } from "@/features/restore/components/restore-preview-panel";

describe("RestorePreviewPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the blocked user-state dry-run plan from restore preview", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      Response.json({
        status: "ready",
        schema: "estudisc.restore-preview.v1",
        sourceExportedAt: "2026-07-30T12:00:00.000Z",
        applicationMode: "non_destructive_plan",
        categories: [],
        warnings: [],
        userStatePlan: {
          schema: "estudisc.user-state-restore-dry-run.v1",
          mode: "user_state_dry_run",
          sourceExportFingerprint: "a".repeat(64),
          applyEnabled: false,
          categories: [
            {
              id: "attempts",
              label: "Tentativas",
              sourceCount: 1,
              restoreStrategy: "append_only_import",
              status: "blocked",
              reason: "Replay append-only depende de provenance e apply futuro."
            }
          ],
          blockers: [
            {
              code: "user_state_apply_not_implemented",
              message: "Restore completo de estado ainda não possui modo apply habilitado."
            }
          ],
          warnings: []
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<RestorePreviewPanel />);

    fireEvent.change(screen.getByLabelText("JSON do Backup"), {
      target: { value: JSON.stringify({ schema: "know-os.export.v1", kind: "backup" }) }
    });
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/restore/preview",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByRole("status", { name: "Estado do restore preview" })).toHaveTextContent(
      "Preview pronto"
    );
    expect(screen.getByRole("list", { name: "Plano de estado do usuário" })).toHaveTextContent("Tentativas");
    expect(screen.getByRole("status", { name: "Bloqueadores do restore" })).toHaveTextContent(
      "Restore completo de estado ainda não possui modo apply habilitado."
    );
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getStudyPreferences, setStudyPreference } from "@/features/study-tools/preferences";
import { ScratchpadToggle } from "@/features/study-tools/scratchpad";
import { StudyPreferencesPanel } from "@/features/study-tools/study-preferences-panel";

describe("study tools", () => {
  beforeEach(() => { window.localStorage.clear(); act(() => { setStudyPreference("sound", false); setStudyPreference("haptics", false); }); });

  it("keeps sound and vibration off by default and persists a change on this device", () => {
    window.localStorage.clear();
    expect(getStudyPreferences()).toEqual({ sound: false, haptics: false });
    act(() => setStudyPreference("haptics", true));
    expect(getStudyPreferences().haptics).toBe(true);
    expect(JSON.parse(window.localStorage.getItem("estudisc.study-preferences.v1") ?? "{}")).toMatchObject({ haptics: true });
  });

  it("exposes accessible switches for the preferences", () => {
    render(<StudyPreferencesPanel />);
    const sound = screen.getByRole("switch", { name: /Som ao responder/ });
    expect(sound).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("switch", { name: /Vibrar no acerto/ }));
    expect(screen.getByRole("switch", { name: /Vibrar no acerto/ })).toHaveAttribute("aria-checked", "true");
  });

  it("opens and closes the scratchpad on demand", () => {
    render(<ScratchpadToggle />);
    const toggle = screen.getByRole("button", { name: "Rascunho" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("toolbar", { name: "Ferramentas do rascunho" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Fechar rascunho" }));
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });
});

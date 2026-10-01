import { describe, expect, it } from "vitest";

import foundation from "../../packs/seeds/ifsc-2027.foundation.curriculum.json";
import { deriveRequirementCoverage, summarizeCurriculum, validateCurriculum } from "@/features/curriculum/api";

const context = { moduleIds: ["mat"], concepts: foundation.settings.map(setting => ({ id: setting.conceptId, moduleId: setting.moduleId, subjectCode: setting.subjectCode })) };

describe("curriculum contracts", () => {
  it("rejects missing/cross-subject references and prerequisite cycles", () => {
    expect(validateCurriculum(foundation, context).ok).toBe(true);
    const cyclic = structuredClone(foundation);
    cyclic.prerequisites.push({ conceptId: "MAT.PCT.CONCEPT", prerequisiteConceptId: "MAT.PCT.CALCULATE", strength: "required" });
    expect(validateCurriculum(cyclic, context)).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ code: "prerequisite_cycle" })]) });
    const wrong = structuredClone(foundation);
    wrong.requirements[0].subjectCode = "POR";
    expect(validateCurriculum(wrong, context).ok).toBe(false);
    wrong.requirements[0].mappedConceptIds.push("missing");
    expect(validateCurriculum(wrong, context).ok).toBe(false);
  });

  it("requires all mapped Concepts, readiness, QA and verified official scope for completeness", () => {
    const ready = { conceptId: "a", published: true, plannerReady: true, qaApproved: true };
    expect(deriveRequirementCoverage([], [ready], true)).toBe("UNMAPPED");
    expect(deriveRequirementCoverage(["a", "b"], [ready], true)).toBe("MAPPED");
    expect(deriveRequirementCoverage(["a"], [{ ...ready, qaApproved: false }], true)).toBe("MAPPED");
    expect(deriveRequirementCoverage(["a"], [ready], false)).toBe("COVERED");
    expect(deriveRequirementCoverage(["a"], [ready], true)).toBe("VALIDATED");
    expect(summarizeCurriculum([{ id: "a", state: "VALIDATED" }, { id: "b", state: "UNMAPPED" }], true).complete).toBe(false);
    expect(summarizeCurriculum([{ id: "a", state: "VALIDATED" }], false).complete).toBe(false);
    expect(summarizeCurriculum([], true).complete).toBe(false);
  });
});

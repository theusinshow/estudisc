import { expect, it } from "vitest";
import { parseEducationalActivityConfig, evaluateEducationalActivity } from "@/features/activities/application/educational-activity";
it("validates semantic answers and evaluates decimal comma without accepting blanks", () => {
  const numeric = parseEducationalActivityConfig({ type:"numeric", expected:1.5 });
  expect(evaluateEducationalActivity(numeric, "1,5").correct).toBe(true);
  expect(evaluateEducationalActivity(numeric, "").correct).toBe(false);
  expect(() => parseEducationalActivityConfig({type:"matching",items:[{id:"a",label:"A"},{id:"b",label:"B"}],destinations:[{id:"x",label:"X"}],expected:{a:"x",b:"x"}})).toThrow();
});

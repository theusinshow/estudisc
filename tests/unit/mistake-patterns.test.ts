import { expect, it } from "vitest";
import { groupMistakeObservations } from "@/features/mistakes/mistake-patterns";
import type { MistakeRecord } from "@/db/repositories/mistake-repository";
const now=new Date("2026-10-08T03:00:00Z");
function row(id:string,patch:Partial<MistakeRecord>={}):MistakeRecord{return{id,conceptStableId:"MAT.TEST",conceptTitle:"Conceito",attemptId:`attempt-${id}`,category:"incorrect_answer",summary:"Resposta incorreta",status:"active",createdAt:now,resolvedAt:null,...patch};}
it("deduplicates records and reports actual Attempt recurrence without inferring a cause",()=>{
  const first=row("one"),second=row("two");
  const input=[first,first,second],snapshot=JSON.stringify(input),[group]=groupMistakeObservations(input);
  expect(group.attemptIds).toEqual(["attempt-one","attempt-two"]);expect(group.activeCount).toBe(2);
  expect(group.recurring).toBe(true);expect(group.causeStatus).toBe("not_established");
  expect(group.explanation).toContain("não identifica a causa");expect(JSON.stringify(input)).toBe(snapshot);
});
it("keeps resolved history and avoids counting one Attempt as repeated evidence",()=>{
  const [group]=groupMistakeObservations([row("one"),row("two",{attemptId:"attempt-one",status:"resolved",resolvedAt:now})]);
  expect(group.recurring).toBe(false);expect(group.activeCount).toBe(1);expect(group.resolvedCount).toBe(1);expect(group.mistakeIds).toHaveLength(2);
});
it("keeps Concepts separate and exposes the newest active original mistake for retry",()=>{
  const groups=groupMistakeObservations([row("old",{createdAt:new Date(now.getTime()-1000)}),row("new"),row("other",{conceptStableId:"CIE.TEST",status:"resolved",resolvedAt:now})]);
  expect(groups[0].conceptId).toBe("MAT.TEST");expect(groups[0].activeMistakeId).toBe("new");expect(groups[1].activeMistakeId).toBeNull();
});

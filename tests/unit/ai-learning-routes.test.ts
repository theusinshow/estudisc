import { beforeEach, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { AiLearningError } from "@/features/ai/contracts";
import { POST } from "@/app/api/ai/learning/route";
import { POST as tutor } from "@/app/api/tutor/route";
const mocks=vi.hoisted(()=>({owner:vi.fn(),execute:vi.fn(),enabled:true}));
vi.mock("@/features/auth/owner",async original=>({...await original<object>(),getOwnerId:mocks.owner}));
vi.mock("@/features/ai/server",()=>({executeLearningAi:mocks.execute}));
vi.mock("@/lib/feature-flags",async original=>({...await original<object>(),getFeatureFlags:()=>({FEATURE_AI_LEARNING:mocks.enabled})}));
const data=()=>({requestId:crypto.randomUUID(),action:"give_hint",target:{kind:"question",activityId:"a",questionId:"q",questionVersion:1}});
const request=(body:unknown)=>new Request("http://localhost/api/ai/learning",{method:"POST",body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();mocks.enabled=true;mocks.owner.mockResolvedValue("authenticated-owner");mocks.execute.mockResolvedValue({text:"Pista.",source:"ai",cached:false,assisted:true});});
it("uses authenticated ownership, strict targets and bounded bodies",async()=>{
  const input=data();expect((await POST(request(input))).status).toBe(200);
  expect(mocks.execute).toHaveBeenCalledWith("authenticated-owner",{...input,message:""},expect.any(AbortSignal));
  mocks.execute.mockClear();
  for(const extra of [{ownerId:"other"},{facts:{answer:5}},{model:"expensive"}])expect((await POST(request({...input,...extra}))).status).toBe(400);
  expect((await POST(request({...input,message:"x".repeat(1001)}))).status).toBe(400);
  expect((await POST(request({pad:"x".repeat(12001)}))).status).toBe(413);expect(mocks.execute).not.toHaveBeenCalled();
});
it("keeps new actions gated and maps absence, quotas, exam and access denial",async()=>{
  mocks.enabled=false;expect((await POST(request(data()))).status).toBe(404);expect(mocks.owner).not.toHaveBeenCalled();mocks.enabled=true;
  for(const [code,status] of [["unconfigured",503],["rate_limited",429],["exam_active",409],["context_unavailable",409]] as const){mocks.execute.mockRejectedValueOnce(new AiLearningError(code));expect((await POST(request(data()))).status).toBe(status);}
  mocks.owner.mockRejectedValueOnce(new AccessDeniedError());expect((await POST(request(data()))).status).toBe(403);
});
it("routes legacy tutor requests through the same service without exposing a bypass",async()=>{
  mocks.enabled=false;
  const legacy={activityId:"a",questionId:"q",questionVersion:1,mode:"SOCRATIC",message:"Como começar?"};
  expect((await tutor(request(legacy))).status).toBe(200);
  expect(mocks.execute).toHaveBeenCalledWith("authenticated-owner",expect.objectContaining({action:"give_hint",message:legacy.message,target:{kind:"question",activityId:"a",questionId:"q",questionVersion:1}}),expect.any(AbortSignal),"SOCRATIC");
  mocks.execute.mockRejectedValueOnce(new AiLearningError("daily_limit"));expect((await tutor(request(legacy))).status).toBe(429);
  mocks.execute.mockRejectedValueOnce(new AiLearningError("exam_active"));expect((await tutor(request(legacy))).status).toBe(409);
});

import { beforeEach,expect,it,vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { GET } from "@/app/api/admin/authoring-context/route";
import { POST } from "@/app/api/admin/authoring-metadata/route";
const mocks=vi.hoisted(()=>({admin:vi.fn(),get:vi.fn(),enabled:true}));
vi.mock("@/features/auth/owner",async original=>({...await original<object>(),requireAdmin:mocks.admin}));
vi.mock("@/lib/feature-flags",async original=>({...await original<object>(),getFeatureFlags:()=>({FEATURE_CONTENT_HEALTH:mocks.enabled})}));
vi.mock("@/db/connection",()=>({getDatabaseUrl:()=>"memory://local",getDatabase:vi.fn()}));
vi.mock("@/db/repositories/authoring-context-repository",()=>({MemoryAuthoringContextRepository:class{get=mocks.get;},AuthoringContextRepository:class{get=mocks.get;}}));
beforeEach(()=>{vi.clearAllMocks();mocks.enabled=true;mocks.admin.mockResolvedValue({ownerId:"authenticated-admin",role:"ADMIN"});mocks.get.mockResolvedValue(null);});
it("denies Student reads/uploads before source resolution or metadata parsing",async()=>{
  mocks.admin.mockRejectedValue(new AccessDeniedError());expect((await GET(new Request("http://localhost/api?lessonId=a"))).status).toBe(403);expect((await POST(new Request("http://localhost/api",{method:"POST",body:"invalid"}))).status).toBe(403);expect(mocks.get).not.toHaveBeenCalled();
});
it("uses the real ADMIN identity and keeps feature-off/source absence explicit",async()=>{
  expect((await GET(new Request("http://localhost/api?lessonId=a"))).status).toBe(404);expect(mocks.get).toHaveBeenCalledWith("authenticated-admin","a",undefined);
  mocks.enabled=false;expect((await GET(new Request("http://localhost/api?lessonId=a"))).status).toBe(404);
});

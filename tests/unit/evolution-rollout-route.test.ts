import {beforeEach,expect,it,vi} from "vitest";
import {AccessDeniedError} from "@/features/auth/owner";
import {GET,POST} from "@/app/api/admin/evolution-rollout/route";
import {evolutionRolloutIdentity} from "@/db/repositories/evolution-rollout-repository";
const mocks=vi.hoisted(()=>({admin:vi.fn(),readiness:vi.fn(),activate:vi.fn(),enabled:true}));
vi.mock("@/features/auth/owner",async original=>({...await original<object>(),requireAdmin:mocks.admin}));
vi.mock("@/lib/feature-flags",async original=>({...await original<object>(),getFeatureFlags:()=>({FEATURE_CONTENT_HEALTH:mocks.enabled})}));
vi.mock("@/db/connection",()=>({getDatabaseUrl:()=>"postgres://disposable",getDatabase:vi.fn()}));
vi.mock("@/db/repositories/evolution-rollout-repository",async original=>({...await original<object>(),EvolutionRolloutRepository:class{readiness=mocks.readiness;activate=mocks.activate;}}));
beforeEach(()=>{vi.clearAllMocks();mocks.enabled=true;mocks.admin.mockResolvedValue({ownerId:"actual-admin",role:"ADMIN"});mocks.readiness.mockResolvedValue({ready:false});mocks.activate.mockResolvedValue({ready:true,applied:[]});});
function request(body:unknown,host="vecta-three.vercel.app"){return new Request(`https://${host}/api/admin/evolution-rollout`,{method:"POST",body:JSON.stringify(body),headers:{"content-type":"application/json"}});}
it("denies Student before readiness or mutations and returns no schema details",async()=>{mocks.admin.mockRejectedValue(new AccessDeniedError());expect((await GET()).status).toBe(403);expect((await POST(request(evolutionRolloutIdentity))).status).toBe(403);expect(mocks.readiness).not.toHaveBeenCalled();expect(mocks.activate).not.toHaveBeenCalled();});
it("rejects caller SQL, altered identity/hash and the wrong production target",async()=>{
 for(const body of [{...evolutionRolloutIdentity,sql:"DROP TABLE owners"},{...evolutionRolloutIdentity,hash:"forged"}])expect((await POST(request(body))).status).toBe(400);
 expect((await POST(request(evolutionRolloutIdentity,"preview.vercel.app"))).status).toBe(409);expect(mocks.activate).not.toHaveBeenCalled();
});
it("uses the actual authenticated actor for the fixed bounded operation",async()=>{expect((await GET()).status).toBe(200);expect((await POST(request(evolutionRolloutIdentity))).status).toBe(200);expect(mocks.activate).toHaveBeenCalledWith("actual-admin");});
it("retains flag-off and oversized request boundaries",async()=>{expect((await POST(request({...evolutionRolloutIdentity,padding:"x".repeat(2000)}))).status).toBe(413);mocks.enabled=false;expect((await GET()).status).toBe(404);expect((await POST(request(evolutionRolloutIdentity))).status).toBe(404);expect(mocks.activate).not.toHaveBeenCalled();});

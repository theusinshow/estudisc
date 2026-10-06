import { expect,it } from "vitest";
import { profileForEmail } from "@/features/auth/owner";
import { getServerEnv } from "@/lib/env";
it("isolates allowlisted identities and keeps administrator role explicit",()=>{
  const env=getServerEnv({ESTUDISC_ALLOWED_GOOGLE_EMAILS:"admin@example.com,student@example.com",ESTUDISC_ADMIN_GOOGLE_EMAILS:"admin@example.com"});
  expect(profileForEmail("Admin@example.com",env).role).toBe("ADMIN");
  expect(profileForEmail("student@example.com",env).role).toBe("STUDENT");
  expect(profileForEmail("admin@example.com",env).ownerId).not.toBe(profileForEmail("student@example.com",env).ownerId);
  expect(()=>profileForEmail("stranger@example.com",env)).toThrow("Access denied");
});

import { expect,it } from "vitest";
import { isAllowedMutationOrigin } from "@/features/auth/mutation-origin";
it("permits the real browser host despite dev URL normalization and rejects cross-site mutations",()=>{
  const url=new URL("http://localhost:3210/api/study-sessions");
  expect(isAllowedMutationOrigin(new Headers({host:"127.0.0.1:3210",origin:"http://127.0.0.1:3210","sec-fetch-site":"same-origin"}),url)).toBe(true);
  expect(isAllowedMutationOrigin(new Headers({host:"127.0.0.1:3210",origin:"https://foreign.example","sec-fetch-site":"cross-site"}),url)).toBe(false);
  expect(isAllowedMutationOrigin(new Headers({host:"127.0.0.1:3210",origin:"https://foreign.example"}),url)).toBe(false);
});

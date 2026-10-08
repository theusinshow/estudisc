import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getDatabaseUrl } from "@/db/connection";
import { EvolutionRolloutRepository,evolutionRolloutIdentity,RolloutConflictError } from "@/db/repositories/evolution-rollout-repository";
import { readJsonRequestWithLimit } from "@/features/import/api";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const inputSchema=z.object({migrationSet:z.literal(evolutionRolloutIdentity.migrationSet),hash:z.literal(evolutionRolloutIdentity.hash),target:z.literal(evolutionRolloutIdentity.target)}).strict();
async function actor(){const admin=await requireAdmin();if(!getFeatureFlags().FEATURE_CONTENT_HEALTH||getDatabaseUrl()==="memory://local")return null;return admin;}
export async function GET(){try{if(!await actor())return NextResponse.json({code:"feature_disabled"},{status:404});return NextResponse.json(await new EvolutionRolloutRepository().readiness(),{headers:{"cache-control":"no-store"}});}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});throw error;}}
export async function POST(request:Request){try{const admin=await actor();if(!admin)return NextResponse.json({code:"feature_disabled"},{status:404});
  const raw=await readJsonRequestWithLimit(request,1024);if(!raw.ok)return NextResponse.json({code:raw.code},{status:raw.code==="payload_too_large"?413:400});
  const input=inputSchema.safeParse(raw.body);if(!input.success)return NextResponse.json({code:"invalid_request"},{status:400});
  if(new URL(request.url).hostname!==input.data.target)return NextResponse.json({code:"target_mismatch"},{status:409});
  return NextResponse.json(await new EvolutionRolloutRepository().activate(admin.ownerId));
}catch(error){if(error instanceof AccessDeniedError)return NextResponse.json({code:"admin_required"},{status:403});if(error instanceof RolloutConflictError)return NextResponse.json({code:"schema_conflict",message:error.message},{status:409});if(error instanceof SyntaxError)return NextResponse.json({code:"invalid_request"},{status:400});throw error;}}

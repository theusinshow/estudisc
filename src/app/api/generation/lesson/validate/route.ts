import { getOwnerId } from "@/features/auth/owner";
import { z } from "zod";
import { NextResponse } from "next/server";

import { readJsonRequestWithLimit } from "@/features/import/api";
import { validateGeneratedLessonOutput } from "@/features/generation/generated-output-validation";
import { getGenerationJobRepository } from "@/features/generation/server-repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  jobId: z.string().trim().min(1).optional(),
  rawJson: z.string()
});

export async function POST(request: Request) {
  const parsedRequest = await readJsonRequestWithLimit(request);

  if (!parsedRequest.ok) {
    return NextResponse.json(
      { code: parsedRequest.code, message: parsedRequest.message },
      { status: parsedRequest.code === "payload_too_large" ? 413 : 400 }
    );
  }

  const requestBody = requestSchema.safeParse(parsedRequest.body);

  if (!requestBody.success) {
    return NextResponse.json(
      {
        code: "invalid_generation_validation_request",
        message: "A validação precisa receber o JSON gerado.",
        issues: requestBody.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      },
      { status: 400 }
    );
  }

  const result = validateGeneratedLessonOutput(requestBody.data.rawJson);

  if (requestBody.data.jobId) {
    await getGenerationJobRepository().updateStatus(
      await getOwnerId(),
      requestBody.data.jobId,
      result.status === "ready_to_preview" ? "ready_to_import" : "invalid"
    );
  }

  if (result.status === "invalid") {
    return NextResponse.json(
      { code: "invalid_generated_lesson", message: "O JSON gerado não passou na validação.", issues: result.issues },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}


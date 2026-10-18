import { notFound } from "next/navigation";
import { z } from "zod";
import { getOwnerId } from "@/features/auth/owner";
import { studySessionRepository } from "@/features/study-sessions/api";
import { readPracticeBlockTarget } from "@/features/study-sessions/practice-block";
import { PracticeBlockPage } from "@/features/study-sessions/practice-block-page";
import { LegacySessionSummary } from "@/features/study-sessions/legacy-session-summary";
export const dynamic="force-dynamic";
/** ADR 0072: practice blocks render here; any other (legacy) session shows a read-only summary. */
export default async function StudyPage({params}:{params:Promise<{sessionId:string}>}){
  const {sessionId}=await params;if(!z.uuid().safeParse(sessionId).success)notFound();
  const result=await studySessionRepository().result(await getOwnerId(),sessionId);if(!result)notFound();
  const target=readPracticeBlockTarget(result.session.policyVersion);
  return target?<PracticeBlockPage result={result} target={target}/>:<LegacySessionSummary result={result}/>;
}

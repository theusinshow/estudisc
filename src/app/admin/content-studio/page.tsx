import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin,AccessDeniedError } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { AppShell } from "@/components/layout/app-shell";
import { AuthoringWorkbench } from "@/features/content-qa/authoring-workbench";
export const dynamic="force-dynamic";
export default async function ContentStudioPage({searchParams}:{searchParams:Promise<{lessonId?:string}>}){
  try{await requireAdmin();}catch(error){if(error instanceof AccessDeniedError)notFound();throw error;}
  if(!getFeatureFlags().FEATURE_CONTENT_HEALTH)notFound();const query=await searchParams;
  return <AppShell><section className="foundation-panel content-panel"><h1>Estúdio de conteúdo</h1><p>Prepare rascunhos com origem preservada e confira fontes, assets e blueprints.</p><Link href="/admin/review">Voltar à administração das aulas</Link><AuthoringWorkbench initialLessonId={query.lessonId??""}/></section></AppShell>;
}

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { resolveAccessState } from "@/features/payments/access-guard";
import { PaywallPanel } from "@/features/payments/paywall-panel";
import { CONTENT_SUMMARY, formatCount } from "@/features/public-site/content-summary";
import { logFunnelEvent } from "@/lib/funnel-events";

type UpgradePageProps = Readonly<{
  searchParams?: Promise<{ status?: string; ref?: string; lesson?: string }>;
}>;

export const dynamic = "force-dynamic";

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const query = await searchParams;
  const access = await resolveAccessState();

  if (access.hasFullAccess) {
    return (
      <AppShell mode="page">
        <article className="foundation-panel content-panel accent-panel accent-learn" aria-labelledby="entitled-title">
          <p className="eyebrow">Acesso Completo Ativo</p>
          <h1 id="entitled-title">Seu acesso completo até a prova está liberado!</h1>
          <p>
            Você tem acesso irrestrito a todas as {formatCount(CONTENT_SUMMARY.lessons)} aulas, {formatCount(CONTENT_SUMMARY.lessonQuestions)} questões, simulados e provas anteriores do Estudisc.
          </p>
          <div className="learning-controls">
            <Link href="/" className="primary-action">
              Começar a estudar
            </Link>
            <Link href="/tracks" className="secondary-action">
              Explorar Trilhas e Aulas
            </Link>
          </div>
        </article>
      </AppShell>
    );
  }

  const initialStatus =
    query?.status === "confirming"
      ? "confirming"
      : query?.status === "failure"
        ? "failure"
        : query?.status === "sandbox"
          ? "sandbox"
          : "idle";

  logFunnelEvent(initialStatus === "idle" ? "paywall_viewed" : "checkout_returned", { status: initialStatus, reasonCode: query?.lesson ? "lesson_locked" : "upgrade_page" });
  return (
    <AppShell mode="page">
      <PaywallPanel
        lockedLessonTitle={typeof query?.lesson === "string" ? query.lesson : undefined}
        initialStatus={initialStatus}
        sandboxRef={typeof query?.ref === "string" ? query.ref : undefined}
      />
    </AppShell>
  );
}

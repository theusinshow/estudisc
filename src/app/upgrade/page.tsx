import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { resolveAccessState } from "@/features/payments/access-guard";
import { PaywallPanel } from "@/features/payments/paywall-panel";

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
            Você tem acesso irrestrito a todas as 132 aulas, 1.144 questões, simulados e plano de estudos do Estudisc.
          </p>
          <div className="learning-controls">
            <Link href="/plan" className="primary-action">
              Ir para o Plano de Estudos
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

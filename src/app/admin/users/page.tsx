import Link from "next/link";
import { notFound } from "next/navigation";
import { getEntitlementRepository } from "@/db/repositories/entitlement-repository";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import { AdminUsersPanel } from "@/features/payments/admin-users-panel";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) notFound();
    throw error;
  }

  const repo = getEntitlementRepository();
  const [users, invites] = await Promise.all([
    repo.listAdminUsersOverview(),
    repo.listInviteCodes()
  ]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Alunos, Bolsas e Acesso Vitalício (R$ 50)</h1>
        <Link href="/admin">Voltar à administração</Link>
        <Link href="/">Abrir visão do aluno</Link>
      </header>
      <main className="main-surface">
        <AdminUsersPanel
          initialUsers={users.map((u) => ({
            ownerId: u.ownerId,
            displayName: u.displayName,
            createdAt: u.createdAt.toISOString(),
            activeEntitlement: u.activeEntitlement,
            latestSource: u.latestEntitlement?.source ?? null,
            latestStatus: u.latestEntitlement?.status ?? null,
            attemptsCount: u.attemptsCount,
            aiRequestsCount: u.aiRequestsCount
          }))}
          initialInvites={invites.map((i) => ({
            id: i.id,
            code: i.code,
            label: i.label,
            maxUses: i.maxUses,
            usedCount: i.usedCount,
            active: i.active
          }))}
        />
      </main>
    </div>
  );
}

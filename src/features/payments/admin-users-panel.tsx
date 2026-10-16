"use client";

import { useState } from "react";

export type AdminUserItem = Readonly<{
  ownerId: string;
  displayName: string;
  createdAt: string;
  activeEntitlement: boolean;
  latestSource: string | null;
  latestStatus: string | null;
  attemptsCount: number;
  aiRequestsCount: number;
}>;

export type AdminInviteItem = Readonly<{
  id: string;
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
}>;

export function AdminUsersPanel({
  initialUsers,
  initialInvites
}: Readonly<{
  initialUsers: readonly AdminUserItem[];
  initialInvites: readonly AdminInviteItem[];
}>) {
  const [invites, setInvites] = useState<readonly AdminInviteItem[]>(initialInvites);
  const [users, setUsers] = useState<readonly AdminUserItem[]>(initialUsers);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("50");
  const [targetOwnerId, setTargetOwnerId] = useState("");
  const [targetAction, setTargetAction] = useState<"grant" | "revoke">("grant");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function refreshData() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      users: Array<{
        ownerId: string;
        displayName: string;
        createdAt: string;
        activeEntitlement: boolean;
        latestEntitlement: { source: string; status: string } | null;
        attemptsCount: number;
        aiRequestsCount: number;
      }>;
      inviteCodes: AdminInviteItem[];
    };
    setInvites(data.inviteCodes);
    setUsers(
      data.users.map((u) => ({
        ownerId: u.ownerId,
        displayName: u.displayName,
        createdAt: u.createdAt,
        activeEntitlement: u.activeEntitlement,
        latestSource: u.latestEntitlement?.source ?? null,
        latestStatus: u.latestEntitlement?.status ?? null,
        attemptsCount: u.attemptsCount,
        aiRequestsCount: u.aiRequestsCount
      }))
    );
  }

  async function handleCreateInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "create_invite",
          code: code.trim().toUpperCase(),
          label: label.trim(),
          maxUses: Number(maxUses) || 50
        })
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback(body.message ?? "Não foi possível criar o código de convite.");
        return;
      }
      setCode("");
      setLabel("");
      setFeedback("Código de bolsa / convite criado com sucesso.");
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function handleGrantOrRevoke(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "grant_or_revoke",
          ownerId: targetOwnerId.trim(),
          action: targetAction,
          reason: reason.trim()
        })
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback(body.message ?? "Falha ao registrar alteração de acesso.");
        return;
      }
      setTargetOwnerId("");
      setReason("");
      setFeedback(
        targetAction === "grant"
          ? "Acesso até a prova concedido com sucesso."
          : "Acesso revogado no registro append-only."
      );
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  const entitledCount = users.filter((u) => u.activeEntitlement).length;

  return (
    <div>
      {feedback ? (
        <p role="status" className="learning-hint">
          {feedback}
        </p>
      ) : null}

      <section className="foundation-panel" aria-labelledby="saas-summary-title">
        <h2 id="saas-summary-title">Resumo de Alunos e Bolsas</h2>
        <p>
          Perfis registrados: <strong>{users.length}</strong> · Com acesso ativo:{" "}
          <strong>{entitledCount}</strong> · Códigos de bolsa criados: <strong>{invites.length}</strong>
        </p>
      </section>

      <section className="foundation-panel" aria-labelledby="create-invite-title">
        <h2 id="create-invite-title">Criar código de bolsa ou turma</h2>
        <form onSubmit={handleCreateInvite} className="learning-controls">
          <label htmlFor="admin-invite-code">Código</label>
          <input
            id="admin-invite-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="IFSC-BOLSA-2027"
            required
          />
          <label htmlFor="admin-invite-label">Turma / descrição</label>
          <input
            id="admin-invite-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Bolsa Social IFSC 2027"
            required
          />
          <label htmlFor="admin-invite-uses">Vagas</label>
          <input
            id="admin-invite-uses"
            type="number"
            min={1}
            max={10000}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            required
          />
          <button type="submit" className="primary-action" disabled={busy}>
            Criar código de bolsa
          </button>
        </form>

        {invites.length > 0 ? (
          <ul className="concept-list">
            {invites.map((invite) => (
              <li key={invite.id}>
                <strong>
                  {invite.code} · {invite.label}
                </strong>
                <span>
                  Usos: {invite.usedCount}/{invite.maxUses} · {invite.active ? "Ativo" : "Inativo"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum código de convite cadastrado ainda.</p>
        )}
      </section>

      <section className="foundation-panel" aria-labelledby="manual-grant-title">
        <h2 id="manual-grant-title">Conceder ou revogar acesso individual</h2>
        <form onSubmit={handleGrantOrRevoke} className="learning-controls">
          <label htmlFor="admin-target-owner">Owner ID do aluno</label>
          <input
            id="admin-target-owner"
            type="text"
            value={targetOwnerId}
            onChange={(e) => setTargetOwnerId(e.target.value)}
            placeholder="google-..."
            required
          />
          <label htmlFor="admin-target-action">Ação</label>
          <select
            id="admin-target-action"
            value={targetAction}
            onChange={(e) => setTargetAction(e.target.value as "grant" | "revoke")}
          >
            <option value="grant">Liberar acesso até a prova</option>
            <option value="revoke">Revogar acesso</option>
          </select>
          <label htmlFor="admin-target-reason">Motivo auditado</label>
          <input
            id="admin-target-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bolsa direta / ajuste de suporte"
            required
          />
          <button type="submit" className="secondary-action" disabled={busy}>
            Registrar alteração
          </button>
        </form>
      </section>

      <section className="foundation-panel" aria-labelledby="students-list-title">
        <h2 id="students-list-title">Alunos, progresso e uso de IA</h2>
        {users.length === 0 ? (
          <p>Nenhum perfil registrado ainda.</p>
        ) : (
          <ul className="concept-list">
            {users.map((user) => (
              <li key={user.ownerId}>
                <strong>
                  {user.displayName} ({user.ownerId})
                </strong>
                <span>
                  Acesso: {user.activeEntitlement ? `Completo (${user.latestSource ?? "ativo"})` : "Degustação gratuita"}{" "}
                  · Questões submetidas: {user.attemptsCount} · Chamadas de IA: {user.aiRequestsCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

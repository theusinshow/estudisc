import { z } from "zod";

export const LIFETIME_PRODUCT_ID = "ifsc-2027-1-full" as const;
/** Owner decision (2026-10-16): one payment gives access until the end of the IFSC 2027/1 exam day (29/11/2026, Brasília). */
export const PAID_ACCESS_ENDS_AT = "2026-11-30T03:00:00.000Z" as const;
export function paidAccessEndsAt(): Date { return new Date(PAID_ACCESS_ENDS_AT); }
export const LIFETIME_PRICE_CENTS = 5000 as const;
export const LIFETIME_PRICE_BRL = 50 as const;
export const LIFETIME_CURRENCY = "BRL" as const;

export const FREE_SAMPLE_LESSON_IDS = ["MAT-07", "CIE-06", "POR-01", "GH-06"] as const;

export type FreeSampleLessonId = (typeof FREE_SAMPLE_LESSON_IDS)[number];

export const FREE_SAMPLE_LESSONS: ReadonlyArray<{
  id: FreeSampleLessonId;
  subject: string;
  title: string;
  interactiveFeature: string;
}> = [
  {
    id: "MAT-07",
    subject: "Matemática",
    title: "Porcentagem: parte, desconto e preço final",
    interactiveFeature: "Explorador numérico de descontos + passos guiados"
  },
  {
    id: "CIE-06",
    subject: "Ciências",
    title: "Estrutura atômica: partículas, massa e íons",
    interactiveFeature: "Simulador interativo 'Monte um átomo' + classificação"
  },
  {
    id: "POR-01",
    subject: "Português",
    title: "Compreensão e inferência: o texto sustenta sua leitura?",
    interactiveFeature: "Predição guiada + destaque de evidências no texto"
  },
  {
    id: "GH-06",
    subject: "Geografia e História",
    title: "Escravidão, resistência e abolição como processo",
    interactiveFeature: "Linha do tempo interativa + classificação histórica"
  }
];

export function isFreeSampleLessonId(lessonStableId: string): boolean {
  return (FREE_SAMPLE_LESSON_IDS as readonly string[]).includes(lessonStableId.trim().toUpperCase());
}

export const entitlementStatusSchema = z.enum(["granted", "refunded", "revoked"]);
export type EntitlementStatus = z.infer<typeof entitlementStatusSchema>;

export const entitlementSourceSchema = z.enum(["mercadopago", "invite_code", "admin_grant", "allowlist"]);
export type EntitlementSource = z.infer<typeof entitlementSourceSchema>;

export type EntitlementRecord = Readonly<{
  id: string;
  ownerId: string;
  productId: string;
  status: EntitlementStatus;
  source: EntitlementSource;
  providerPaymentId: string | null;
  amountCents: number;
  currency: string;
  startsAt: Date;
  endsAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}>;

export type AppendEntitlementInput = Readonly<{
  ownerId: string;
  productId?: string;
  status: EntitlementStatus;
  source: EntitlementSource;
  providerPaymentId?: string | null;
  amountCents?: number;
  currency?: string;
  startsAt?: Date;
  endsAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}>;

export type InviteCodeRecord = Readonly<{
  id: string;
  code: string;
  label: string;
  productId: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
  createdBy: string;
  createdAt: Date;
}>;

export type CreateInviteCodeInput = Readonly<{
  code: string;
  label: string;
  productId?: string;
  maxUses: number;
  expiresAt?: Date | null;
  createdBy: string;
}>;

export const redeemInviteCodeSchema = z.object({
  code: z.string().trim().min(3).max(64).transform((val) => val.toUpperCase())
});

export const createInviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{4,40}$/, "Use apenas letras, números e hífen (4 a 40 caracteres)."),
  label: z.string().trim().min(2).max(120),
  maxUses: z.coerce.number().int().min(1).max(10000).default(50),
  expiresAt: z.iso.datetime().optional().nullable()
});

export const adminGrantEntitlementSchema = z.object({
  ownerId: z.string().trim().min(3).max(128),
  displayName: z.string().trim().min(1).max(120).optional(),
  action: z.enum(["grant", "revoke"]),
  reason: z.string().trim().min(2).max(240)
});

/**
 * Append-only evaluation rule (ADR 0061):
 * Active access holds when the latest entitlement row for the product has `status === "granted"`
 * and either `endsAt === null` (lifetime) or `now < endsAt`.
 */
export function evaluateEntitlementAccess(
  rows: readonly EntitlementRecord[],
  now: Date = new Date(),
  productId: string = LIFETIME_PRODUCT_ID
): { active: boolean; latest: EntitlementRecord | null } {
  const matching = rows
    .filter((row) => row.productId === productId)
    .slice()
    .sort((a, b) => {
      const diff = b.createdAt.getTime() - a.createdAt.getTime();
      return diff !== 0 ? diff : b.id.localeCompare(a.id);
    });

  const latest = matching[0] ?? null;
  if (!latest) {
    return { active: false, latest: null };
  }

  const notExpired = latest.endsAt === null || now.getTime() < latest.endsAt.getTime();
  return {
    active: latest.status === "granted" && notExpired,
    latest
  };
}

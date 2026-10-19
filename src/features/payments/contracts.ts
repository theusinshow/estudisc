import { z } from "zod";

export const LIFETIME_PRODUCT_ID = "ifsc-2027-1-full" as const;
/** Owner decision (2026-10-16): one payment gives access until the end of the IFSC 2027/1 exam day (29/11/2026, Brasília). */
export const PAID_ACCESS_ENDS_AT = "2026-11-30T03:00:00.000Z" as const;
export function paidAccessEndsAt(): Date { return new Date(PAID_ACCESS_ENDS_AT); }
/** Owner decision (2026-10-19): R$ 39,90, a more social price (was R$ 50). Payments at or above it grant access. */
export const LIFETIME_PRICE_CENTS = 3990 as const;
/** Amount sent to Mercado Pago and structured data (39.9). */
export const LIFETIME_PRICE_AMOUNT = LIFETIME_PRICE_CENTS / 100;
/** Price as students read it, without "R$": "39,90". */
export const LIFETIME_PRICE_BRL = (LIFETIME_PRICE_CENTS / 100).toFixed(2).replace(".", ",");
export const LIFETIME_CURRENCY = "BRL" as const;

export const FREE_SAMPLE_LESSON_IDS = ["MAT-07", "CIE-01", "POR-03", "GH-51"] as const;

export type FreeSampleLessonId = (typeof FREE_SAMPLE_LESSON_IDS)[number];

/** Titles mirror the published lessons that open for free (latest version of each stable id). */
export const FREE_SAMPLE_LESSONS: ReadonlyArray<{
  id: FreeSampleLessonId;
  subject: string;
  title: string;
  interactiveFeature: string;
}> = [
  {
    id: "MAT-07",
    subject: "Matemática",
    title: "Porcentagem",
    interactiveFeature: "Explorador numérico + 6 passos guiados + 12 questões"
  },
  {
    id: "CIE-01",
    subject: "Ciências",
    title: "Movimento",
    interactiveFeature: "Previsão guiada + 2 exemplos resolvidos + 8 questões"
  },
  {
    id: "POR-03",
    subject: "Português",
    title: "Inferência, implícitos, pressupostos e leitura de contexto",
    interactiveFeature: "Previsão guiada + exemplo resolvido + 8 questões"
  },
  {
    id: "GH-51",
    subject: "Geografia e História",
    title: "Fusos horários e coordenadas geográficas",
    interactiveFeature: "2 exemplos resolvidos com cálculo + 8 questões"
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

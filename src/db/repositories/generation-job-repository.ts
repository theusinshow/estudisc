import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { generationJobs, owners } from "@/db/schema";
import type * as schema from "@/db/schema";
import type {
  CompiledGenerationPrompt,
  GenerationMode,
  GenerationProviderUsage,
  GenerationSpec,
  GenerationStatus
} from "@/features/generation/contracts";

type GenerationJobDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type GenerationStatusTimelineEntry = Readonly<{
  status: GenerationStatus;
  at: string;
  note?: string;
}>;

export type GenerationJobRecord = Readonly<{
  id: string;
  ownerId: string;
  mode: GenerationMode;
  provider: "manual" | "deepseek";
  model: string | null;
  targetSchema: GenerationSpec["targetSchema"];
  spec: GenerationSpec;
  compiledPrompt: CompiledGenerationPrompt | null;
  status: GenerationStatus;
  statusTimeline: readonly GenerationStatusTimelineEntry[];
  rawResponseMetadataHash: string | null;
  validationResult: unknown | null;
  providerUsage: GenerationProviderUsage | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CreateGenerationJobInput = Readonly<{
  ownerId: string;
  mode: GenerationMode;
  provider: "manual" | "deepseek";
  model?: string | null;
  spec: GenerationSpec;
  compiledPrompt?: CompiledGenerationPrompt | null;
  status?: GenerationStatus;
  now?: Date;
}>;

export class GenerationJobRepository {
  constructor(private readonly db: GenerationJobDatabase = getDatabase()) {}

  async create(input: CreateGenerationJobInput): Promise<GenerationJobRecord> {
    const now = input.now ?? new Date();
    const status = input.status ?? (input.compiledPrompt ? "compiled" : "draft");
    const [row] = await this.db.transaction(async (tx) => {
      await tx
        .insert(owners)
        .values({ id: input.ownerId, displayName: "Local owner" })
        .onConflictDoNothing({ target: owners.id });

      return tx
        .insert(generationJobs)
        .values({
          ownerId: input.ownerId,
          mode: input.mode,
          provider: input.provider,
          model: input.model ?? null,
          targetSchema: input.spec.targetSchema,
          spec: input.spec,
          compiledPrompt: input.compiledPrompt ?? null,
          status,
          statusTimeline: [{ status, at: now.toISOString() }],
          createdAt: now,
          updatedAt: now
        })
        .returning();
    });

    if (!row) {
      throw new Error("Failed to create GenerationJob");
    }

    return mapGenerationJobRow(row);
  }

  async get(ownerId: string, id: string): Promise<GenerationJobRecord | null> {
    const [row] = await this.db
      .select()
      .from(generationJobs)
      .where(and(eq(generationJobs.ownerId, ownerId), eq(generationJobs.id, id)))
      .limit(1);

    return row ? mapGenerationJobRow(row) : null;
  }

  async updateStatus(
    ownerId: string,
    id: string,
    status: GenerationStatus,
    options: Readonly<{ note?: string; now?: Date }> = {}
  ): Promise<GenerationJobRecord | null> {
    const existing = await this.get(ownerId, id);

    if (!existing) {
      return null;
    }

    const now = options.now ?? new Date();
    const statusTimeline = [
      ...existing.statusTimeline,
      { status, at: now.toISOString(), ...(options.note ? { note: options.note } : {}) }
    ];
    const [row] = await this.db
      .update(generationJobs)
      .set({ status, statusTimeline, updatedAt: now })
      .where(and(eq(generationJobs.ownerId, ownerId), eq(generationJobs.id, id)))
      .returning();

    return row ? mapGenerationJobRow(row) : null;
  }

  async recordProviderUsage(
    ownerId: string,
    id: string,
    providerUsage: GenerationProviderUsage,
    now = new Date()
  ): Promise<GenerationJobRecord | null> {
    const [row] = await this.db
      .update(generationJobs)
      .set({ providerUsage, updatedAt: now })
      .where(and(eq(generationJobs.ownerId, ownerId), eq(generationJobs.id, id)))
      .returning();

    return row ? mapGenerationJobRow(row) : null;
  }
}

export class MemoryGenerationJobRepository {
  private readonly jobs = getMemoryGenerationJobs();

  async create(input: CreateGenerationJobInput): Promise<GenerationJobRecord> {
    const now = input.now ?? new Date();
    const status = input.status ?? (input.compiledPrompt ? "compiled" : "draft");
    const job: GenerationJobRecord = {
      id: `memory-generation-job-${this.jobs.length + 1}`,
      ownerId: input.ownerId,
      mode: input.mode,
      provider: input.provider,
      model: input.model ?? null,
      targetSchema: input.spec.targetSchema,
      spec: input.spec,
      compiledPrompt: input.compiledPrompt ?? null,
      status,
      statusTimeline: [{ status, at: now.toISOString() }],
      rawResponseMetadataHash: null,
      validationResult: null,
      providerUsage: null,
      createdAt: now,
      updatedAt: now
    };

    this.jobs.push(job);
    return job;
  }

  async get(ownerId: string, id: string): Promise<GenerationJobRecord | null> {
    return this.jobs.find((job) => job.ownerId === ownerId && job.id === id) ?? null;
  }

  async updateStatus(
    ownerId: string,
    id: string,
    status: GenerationStatus,
    options: Readonly<{ note?: string; now?: Date }> = {}
  ): Promise<GenerationJobRecord | null> {
    const existing = await this.get(ownerId, id);

    if (!existing) {
      return null;
    }

    const now = options.now ?? new Date();
    const updated: GenerationJobRecord = {
      ...existing,
      status,
      statusTimeline: [
        ...existing.statusTimeline,
        { status, at: now.toISOString(), ...(options.note ? { note: options.note } : {}) }
      ],
      updatedAt: now
    };
    this.replace(updated);
    return updated;
  }

  async recordProviderUsage(
    ownerId: string,
    id: string,
    providerUsage: GenerationProviderUsage,
    now = new Date()
  ): Promise<GenerationJobRecord | null> {
    const existing = await this.get(ownerId, id);

    if (!existing) {
      return null;
    }

    const updated = { ...existing, providerUsage, updatedAt: now };
    this.replace(updated);
    return updated;
  }

  private replace(updated: GenerationJobRecord) {
    const index = this.jobs.findIndex((job) => job.id === updated.id);

    if (index >= 0) {
      this.jobs[index] = updated;
    }
  }
}

const globalGenerationJobStore = globalThis as typeof globalThis & {
  __estudiscGenerationJobs?: GenerationJobRecord[];
};

function getMemoryGenerationJobs() {
  globalGenerationJobStore.__estudiscGenerationJobs ??= [];
  return globalGenerationJobStore.__estudiscGenerationJobs;
}

function mapGenerationJobRow(row: typeof generationJobs.$inferSelect): GenerationJobRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    mode: row.mode as GenerationMode,
    provider: row.provider as "manual" | "deepseek",
    model: row.model,
    targetSchema: row.targetSchema as GenerationSpec["targetSchema"],
    spec: row.spec as GenerationSpec,
    compiledPrompt: row.compiledPrompt as CompiledGenerationPrompt | null,
    status: row.status as GenerationStatus,
    statusTimeline: row.statusTimeline as GenerationStatusTimelineEntry[],
    rawResponseMetadataHash: row.rawResponseMetadataHash,
    validationResult: row.validationResult,
    providerUsage: row.providerUsage as GenerationProviderUsage | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

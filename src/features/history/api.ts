import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { withHistoryRepository } from "@/db/repositories/history-repository";
import { MemoryHistoryRepository } from "@/db/repositories/memory-store";

export async function listHistoryEvents() {
  const ownerId = await getOwnerId();

  if (getDatabaseUrl() === "memory://local") {
    return new MemoryHistoryRepository().listEvents(ownerId);
  }

  return withHistoryRepository((repository) => repository.listEvents(ownerId));
}


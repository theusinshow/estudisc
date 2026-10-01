import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryMistakeRepository } from "@/db/repositories/memory-store";
import { MistakeRepository } from "@/db/repositories/mistake-repository";

type MistakeStore = Pick<MistakeRepository, "listMistakes">;

export async function listMistakes(repository: MistakeStore = createMistakeRepository()) {
  return repository.listMistakes(await getOwnerId());
}

function createMistakeRepository(): MistakeStore {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryMistakeRepository();
  }

  return new MistakeRepository();
}


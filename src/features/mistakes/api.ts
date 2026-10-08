import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryMistakeRepository } from "@/db/repositories/memory-store";
import { MistakeRepository } from "@/db/repositories/mistake-repository";
import { mistakeReflectionSchema, type MistakeReflectionInput } from "./reflection-contracts";

type MistakeStore = Pick<MistakeRepository, "listMistakes">;

export async function listMistakes(repository: MistakeStore = createMistakeRepository()) {
  return repository.listMistakes(await getOwnerId());
}

export async function getMistakeReflections(){return createMistakeRepository().listReflections(await getOwnerId());}
export async function recordMistakeReflection(input:MistakeReflectionInput){return createMistakeRepository().recordReflection(await getOwnerId(),mistakeReflectionSchema.parse(input));}
function createMistakeRepository(): MistakeRepository|MemoryMistakeRepository {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryMistakeRepository();
  }

  return new MistakeRepository();
}


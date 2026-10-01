import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { MemoryProjectRepository } from "@/db/repositories/memory-store";
import { ProjectRepository } from "@/db/repositories/project-repository";

type ProjectStore = Pick<ProjectRepository, "createProject" | "listProjects">;

export async function listProjects(repository: ProjectStore = createProjectRepository()) {
  return repository.listProjects(await getOwnerId());
}

export async function createProjectContext(
  input: Readonly<{
    stableId: string;
    title: string;
    description?: string | null;
    conceptStableIds?: readonly string[];
    activityStableIds?: readonly string[];
  }>,
  repository: ProjectStore = createProjectRepository()
) {
  return repository.createProject({
    ownerId: await getOwnerId(),
    ...input
  });
}

function createProjectRepository(): ProjectStore {
  if (getDatabaseUrl() === "memory://local") {
    return new MemoryProjectRepository();
  }

  return new ProjectRepository();
}


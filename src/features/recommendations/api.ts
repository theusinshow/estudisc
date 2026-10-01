import { getOwnerId } from "@/features/auth/owner";
import { getDatabaseUrl } from "@/db/connection";
import { CatalogRepository, withCatalogRepository } from "@/db/repositories/catalog-repository";
import {
  MemoryCatalogRepository,
  MemoryMistakeRepository,
  MemoryProjectRepository,
  MemoryReviewRepository
} from "@/db/repositories/memory-store";
import { MistakeRepository } from "@/db/repositories/mistake-repository";
import { ProjectRepository } from "@/db/repositories/project-repository";
import { ReviewRepository } from "@/db/repositories/review-repository";
import { buildRecommendations } from "@/features/recommendations/recommendation-rules";

export async function getRecommendations() {
  const ownerId = await getOwnerId();

  if (getDatabaseUrl() === "memory://local") {
    const [dueReviews, mistakes, tracks, projects] = await Promise.all([
      new MemoryReviewRepository().listDueReviews(ownerId),
      new MemoryMistakeRepository().listMistakes(ownerId),
      new MemoryCatalogRepository().listTracks(),
      new MemoryProjectRepository().listProjects(ownerId)
    ]);

    return buildRecommendations({ dueReviews, mistakes, tracks, projects });
  }

  return withCatalogRepository(async (catalogRepository: CatalogRepository) => {
    const [dueReviews, mistakes, tracks, projects] = await Promise.all([
      new ReviewRepository().listDueReviews(ownerId),
      new MistakeRepository().listMistakes(ownerId),
      catalogRepository.listTracks(),
      new ProjectRepository().listProjects(ownerId)
    ]);

    return buildRecommendations({ dueReviews, mistakes, tracks, projects });
  });
}


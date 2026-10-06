import { getOwnerProfile } from "@/features/auth/owner";
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

export async function getRecommendationInputs(profile = undefined as Awaited<ReturnType<typeof getOwnerProfile>> | undefined) {
  const {ownerId,role} = profile ?? await getOwnerProfile();
  if(!getDatabaseUrl())return {dueReviews:[],mistakes:[],tracks:[],projects:[]};

  if (getDatabaseUrl() === "memory://local") {
    const [dueReviews, mistakes, tracks, projects] = await Promise.all([
      new MemoryReviewRepository().listDueReviews(ownerId),
      new MemoryMistakeRepository().listMistakes(ownerId),
      new MemoryCatalogRepository().listTracks(),
      new MemoryProjectRepository().listProjects(ownerId)
    ]);

    return { dueReviews, mistakes, tracks:tracks.filter(track=>track.lessonCount>0), projects };
  }

  return withCatalogRepository(async (catalogRepository: CatalogRepository) => {
    const [dueReviews, mistakes, tracks, projects] = await Promise.all([
      new ReviewRepository().listDueReviews(ownerId),
      new MistakeRepository().listMistakes(ownerId),
      catalogRepository.listTracks(role==="STUDENT"),
      new ProjectRepository().listProjects(ownerId)
    ]);

    return { dueReviews, mistakes, tracks:tracks.filter(track=>track.lessonCount>0), projects };
  });
}


export async function getRecommendations() { return buildRecommendations(await getRecommendationInputs()); }

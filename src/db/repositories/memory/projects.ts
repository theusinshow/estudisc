import type { CreatedProject, ProjectSummary } from "@/db/repositories/project-repository";
import { getMemoryStore } from './store';


export class MemoryProjectRepository {
  constructor(private readonly store = getMemoryStore()) {}

  async createProject({
    ownerId,
    stableId,
    title,
    description = null,
    conceptStableIds = [],
    activityStableIds = []
  }: Readonly<{
    ownerId: string;
    stableId: string;
    title: string;
    description?: string | null;
    conceptStableIds?: readonly string[];
    activityStableIds?: readonly string[];
  }>): Promise<CreatedProject> {
    const existing = this.store.projects.find(
      (project) => project.ownerId === ownerId && project.stableId === stableId
    );
    const knownConceptIds = new Set(this.store.concepts.map((concept) => concept.stableId));
    const linkedConceptIds = conceptStableIds.filter((conceptStableId) => knownConceptIds.has(conceptStableId));
    const knownActivityIds = new Set(this.store.activities.map((activity) => activity.stableId));
    const linkedActivityIds = activityStableIds.filter((activityStableId) => knownActivityIds.has(activityStableId));

    if (existing) {
      existing.title = title;
      existing.description = description;
      linkedConceptIds.forEach((conceptStableId) => existing.conceptStableIds.add(conceptStableId));
      linkedActivityIds.forEach((activityStableId) => existing.activityStableIds.add(activityStableId));

      return {
        stableId: existing.stableId,
        linkedConcepts: existing.conceptStableIds.size,
        linkedActivities: existing.activityStableIds.size
      };
    }

    this.store.projects.push({
      ownerId,
      stableId,
      title,
      description,
      status: "active",
      conceptStableIds: new Set(linkedConceptIds),
      activityStableIds: new Set(linkedActivityIds)
    });

    return {
      stableId,
      linkedConcepts: linkedConceptIds.length,
      linkedActivities: linkedActivityIds.length
    };
  }

  async listProjects(ownerId: string): Promise<ProjectSummary[]> {
    return this.store.projects
      .filter((project) => project.ownerId === ownerId)
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((project) => ({
        stableId: project.stableId,
        title: project.title,
        description: project.description,
        status: project.status,
        conceptCount: project.conceptStableIds.size,
        activityCount: project.activityStableIds.size
      }));
  }
}

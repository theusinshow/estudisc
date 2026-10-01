import { curriculumFoundationSchema, type CurriculumFoundation, type CurriculumIssue } from "./contracts";

export type CurriculumContext = Readonly<{
  concepts: readonly { id: string; moduleId: string; subjectCode: string }[];
  moduleIds: readonly string[];
}>;

export function validateCurriculum(input: unknown, context: CurriculumContext):
  | { ok: true; foundation: CurriculumFoundation }
  | { ok: false; issues: CurriculumIssue[] } {
  const parsed = curriculumFoundationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, issues: parsed.error.issues.map(issue => ({ code: "invalid_schema", path: issue.path.join("."), message: issue.message })) };
  const foundation = parsed.data;
  const issues: CurriculumIssue[] = [];
  const issue = (code: string, path: string, message: string) => issues.push({ code, path, message });
  const concepts = new Map(context.concepts.map(concept => [concept.id, concept]));
  const sources = new Map(foundation.sources.map(source => [source.id, source]));
  const requirements = new Map(foundation.requirements.map(requirement => [requirement.id, requirement]));
  const settings = new Map(foundation.settings.map(setting => [setting.conceptId, setting]));
  for (const [items, key, path] of [
    [foundation.sources, "id", "sources"],
    [foundation.requirements, "id", "requirements"],
    [foundation.settings, "conceptId", "settings"]
  ] as const) {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const value = (item as Record<string, string>)[key];
      if (seen.has(value)) issue("duplicate_id", `${path}.${index}`, `Duplicate ${value}`);
      seen.add(value);
    });
  }
  foundation.settings.forEach((setting, index) => {
    const concept = concepts.get(setting.conceptId);
    if (!concept || !context.moduleIds.includes(setting.moduleId)) issue("unknown_reference", `settings.${index}`, "Concept or Module is outside this Track");
    else if (concept.moduleId !== setting.moduleId || concept.subjectCode !== setting.subjectCode) issue("invalid_context", `settings.${index}`, "Concept belongs to another Module or subject");
  });
  foundation.requirements.forEach((requirement, index) => {
    const source = sources.get(requirement.sourceId);
    if (!source || source.type !== "official_curriculum") issue("invalid_source", `requirements.${index}.sourceId`, "Requirement needs an official curriculum source");
    if (requirement.parentId && !requirements.has(requirement.parentId)) issue("unknown_parent", `requirements.${index}.parentId`, "Parent requirement does not exist");
    if (requirement.parentId && requirements.get(requirement.parentId)?.subjectCode !== requirement.subjectCode) issue("invalid_context", `requirements.${index}.parentId`, "Parent belongs to another subject");
    requirement.mappedConceptIds.forEach(id => {
      if (!settings.has(id)) issue("unknown_concept", `requirements.${index}.mappedConceptIds`, `Concept ${id} has no Track setting`);
      else if (settings.get(id)?.subjectCode !== requirement.subjectCode) issue("invalid_context", `requirements.${index}.mappedConceptIds`, "Mapping crosses subjects");
    });
  });
  const seenEdges = new Set<string>();
  foundation.prerequisites.forEach((edge, index) => {
    const key = JSON.stringify([edge.conceptId, edge.prerequisiteConceptId]);
    if (seenEdges.has(key)) issue("duplicate_prerequisite", `prerequisites.${index}`, "Prerequisite pair repeated");
    seenEdges.add(key);
    if (!settings.has(edge.conceptId) || !settings.has(edge.prerequisiteConceptId)) issue("unknown_concept", `prerequisites.${index}`, "Both Concepts need settings in this Track");
  });
  for (const cycle of findGraphCycles(foundation.prerequisites.map(edge => [edge.conceptId, edge.prerequisiteConceptId]))) issue("prerequisite_cycle", "prerequisites", cycle.join(" → "));
  for (const cycle of findGraphCycles(foundation.requirements.flatMap(requirement => requirement.parentId ? [[requirement.id, requirement.parentId] as const] : []))) issue("requirement_cycle", "requirements", cycle.join(" → "));
  return issues.length ? { ok: false, issues } : { ok: true, foundation };
}

// Iterative DFS avoids stack overflow for deeply nested untrusted Packs.
export function findGraphCycles(edges: readonly (readonly [string, string])[]): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const [from, to] of edges) adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
  const complete = new Set<string>();
  const cycles: string[][] = [];
  for (const root of adjacency.keys()) {
    if (complete.has(root)) continue;
    const stack = [{ id: root, next: 0 }];
    const active = new Map([[root, 0]]);
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const children = adjacency.get(frame.id) ?? [];
      if (frame.next >= children.length) { complete.add(frame.id); active.delete(frame.id); stack.pop(); continue; }
      const child = children[frame.next++];
      const position = active.get(child);
      if (position !== undefined) cycles.push([...stack.slice(position).map(node => node.id), child]);
      else if (!complete.has(child)) { active.set(child, stack.length); stack.push({ id: child, next: 0 }); }
    }
  }
  return cycles;
}

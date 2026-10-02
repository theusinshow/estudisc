// Editorial release groups: which lessons the bulk review preselects. Configuration, not curriculum logic.
export const RELEASE_GROUPS: ReadonlyArray<Readonly<{ label: string; lessonIds: readonly string[] }>> = [
  { label: "Semana 1", lessonIds: ["MAT-01", "MAT-02", "POR-01", "POR-02", "CIE-01", "CIE-02", "GH-01", "GH-02"] }
];

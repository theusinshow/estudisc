export const assessmentKindLabel: Record<string, string> = {
  BROAD_DIAGNOSTIC: "Diagnóstico geral",
  TARGETED_DIAGNOSTIC: "Diagnóstico focado",
  MINI_SIMULATION: "Minissimulado",
  SUBJECT_SIMULATION: "Simulado por área",
  FULL_SIMULATION: "Simulado completo",
  OFFICIAL_EXAM: "Prova anterior"
};

export const subjectLabel: Record<string, string> = { MAT: "Matemática", POR: "Português", CIE: "Ciências", GH: "Geografia e História" };

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return hours ? `${hours} h${rest ? ` ${rest} min` : ""}` : `${rest} min`;
}

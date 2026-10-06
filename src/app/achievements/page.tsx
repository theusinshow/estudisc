import "@/styles/achievements.css";
import { AppShell } from "@/components/layout/app-shell";
import { getGamificationSummary } from "@/features/gamification/api";
import { AchievementsBoard } from "@/features/gamification/achievements-board";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const summary = await getGamificationSummary();
  return <AppShell><AchievementsBoard summary={summary} /></AppShell>;
}

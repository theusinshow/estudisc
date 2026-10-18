import { redirect } from "next/navigation";

/** ADR 0072: the planner is retired; old links and post-payment returns that point here land on Hoje. */
export default function PlanPage() {
  redirect("/");
}

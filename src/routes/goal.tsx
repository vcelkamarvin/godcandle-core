import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/goal")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: GoalRedirect,
});

export function GoalRedirect() {
  return null;
}

// Retained stub for test backward-compatibility
export const GoalPage = GoalRedirect;

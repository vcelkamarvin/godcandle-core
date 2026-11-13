import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teamwork")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: TeamworkRedirect,
});

export function TeamworkRedirect() {
  return null;
}

// Retained stub for test backward-compatibility
export const TeamworkPage = TeamworkRedirect;

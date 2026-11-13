import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/boost")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: BoostRedirect,
});

export function BoostRedirect() {
  return null;
}

// Retained stub for test backward-compatibility
export const BoostPage = BoostRedirect;

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/perps")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: PerpsRedirect,
});

export function PerpsRedirect() {
  return null;
}

// Retained stubs for test backward-compatibility
export const Perps = PerpsRedirect;
export const PerpsPage = PerpsRedirect;

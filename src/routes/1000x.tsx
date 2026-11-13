import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/1000x")({
  beforeLoad: () => {
    throw redirect({ to: "/trade" });
  },
  component: RedirectTrade,
});

function RedirectTrade() {
  return null;
}

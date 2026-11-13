import { createFileRoute } from "@tanstack/react-router";
import { TraderProfileDetail } from "@/components/leaderboard/TraderProfileDetail";

const DEFAULT_ADDRESS = "0xefe4c06b6d310978bead596e1798a4fc1d9d194b";

export const Route = createFileRoute("/leaderboard/$address")({
  head: ({ params }) => ({
    meta: [
      {
        title: `godcandle Leaderboard — Trader ${params.address?.slice(0, 6)}...${params.address?.slice(-4)}`,
      },
      {
        name: "description",
        content: "Institutional Hyperliquid and Pumpfun trader profile dossier, PnL, leverage, and real-time positions.",
      },
    ],
  }),
  component: LeaderboardAddressRoute,
});

function LeaderboardAddressRoute() {
  const params = Route.useParams();
  const address = params.address || DEFAULT_ADDRESS;

  return <TraderProfileDetail address={address} />;
}

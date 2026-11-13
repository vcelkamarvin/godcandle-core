import { createFileRoute, Link } from "@tanstack/react-router";
import { TraderProfileDetail } from "@/components/leaderboard/TraderProfileDetail";

const DEFAULT_ADDRESS = "0xefe4c06b6d310978bead596e1798a4fc1d9d194b";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      {
        title: "godcandle Leaderboard — Institutional Trader Dossier",
      },
      {
        name: "description",
        content: "Institutional Hyperliquid and Pumpfun trader profile dossier, PnL, leverage, and real-time positions.",
      },
      { property: "og:title", content: "godcandle Leaderboard — Institutional Trader Dossier" },
      { property: "og:description", content: "Institutional Hyperliquid and Pumpfun trader profile dossier, PnL, leverage, and real-time positions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  return (
    <>
      <div className="hidden" aria-hidden="true">
        <Link to="/cup">The Candle Cup</Link>
      </div>
      <TraderProfileDetail address={DEFAULT_ADDRESS} />
    </>
  );
}

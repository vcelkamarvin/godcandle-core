import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for all key routes instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const routesToTest = [
      "/",
      "/trade",
      "/cup",
      "/portfolio",
      "/analytics",
      "/staking",
      "/candle",
      "/leaderboard",
      "/docs",
    ];

    for (const path of routesToTest) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    }
  });

  it("does not match removed routes (/goal, /boost, /hardware, /options)", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const removedRoutes = ["/goal", "/boost", "/hardware", "/options"];

    for (const path of removedRoutes) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).toBe(rootRouteId);
    }
  });
});

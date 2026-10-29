<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep financial types, fee-inclusive liquidation and P&L in src/lib/engine.ts; every display and settlement must share these formulas to prevent inconsistent values.
- Keep market metadata in src/config/markets.ts and browser-only simulation/seed data in src/lib/price-feed.ts and src/lib/mock-data.ts; no real funds, backend persistence or external price feeds belong in this internal tester.
- Share browser-session trading state through TradingProvider in the root shell so Trade, Portfolio and Analytics read the same positions and settlements without persistence.

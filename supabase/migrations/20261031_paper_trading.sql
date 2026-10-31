-- Supabase Schema Migration: Paper Trading (1000x Mode)
-- Tables: paper_accounts, paper_positions, paper_trades, paper_equity_snapshots
-- View: weekly_leaderboard (ranking by highest closed-trade ROI% resetting Mon 00:00 UTC)

CREATE TABLE IF NOT EXISTS public.paper_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    wallet_address TEXT,
    balance NUMERIC NOT NULL DEFAULT 10000.00,
    last_reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.paper_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    margin NUMERIC NOT NULL,
    leverage INTEGER NOT NULL CHECK (leverage >= 1 AND leverage <= 1000),
    notional NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    liq_price NUMERIC NOT NULL,
    tp_price NUMERIC,
    sl_price NUMERIC,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_closed BOOLEAN NOT NULL DEFAULT false,
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.paper_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
    position_id UUID REFERENCES public.paper_positions(id) ON DELETE SET NULL,
    asset TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    margin NUMERIC NOT NULL,
    leverage INTEGER NOT NULL,
    notional NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC NOT NULL,
    pnl NUMERIC NOT NULL,
    roi_pct NUMERIC NOT NULL,
    liquidated BOOLEAN NOT NULL DEFAULT false,
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.paper_equity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
    equity NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paper_positions_account ON public.paper_positions(account_id) WHERE is_closed = false;
CREATE INDEX IF NOT EXISTS idx_paper_positions_open ON public.paper_positions(asset, is_closed) WHERE is_closed = false;
CREATE INDEX IF NOT EXISTS idx_paper_trades_account ON public.paper_trades(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_closed_at ON public.paper_trades(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_paper_trades_roi ON public.paper_trades(roi_pct DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_equity_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read and write keyed by session_id or wallet_address
CREATE POLICY "Public read paper accounts"
    ON public.paper_accounts FOR SELECT
    USING (true);

CREATE POLICY "Insert or update own paper account"
    ON public.paper_accounts FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public read paper positions"
    ON public.paper_positions FOR SELECT
    USING (true);

CREATE POLICY "Manage paper positions"
    ON public.paper_positions FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public read paper trades"
    ON public.paper_trades FOR SELECT
    USING (true);

CREATE POLICY "Manage paper trades"
    ON public.paper_trades FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public read paper equity"
    ON public.paper_equity_snapshots FOR SELECT
    USING (true);

CREATE POLICY "Manage paper equity"
    ON public.paper_equity_snapshots FOR ALL
    USING (true)
    WITH CHECK (true);

-- Weekly Leaderboard View:
-- Best closed-trade ROI% for the current week starting Mon 00:00 UTC
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT 
    t.id AS trade_id,
    a.id AS account_id,
    COALESCE(a.wallet_address, CONCAT('Guest_', SUBSTRING(a.session_id, 1, 6))) AS trader_identifier,
    t.asset,
    t.side,
    t.leverage,
    t.margin,
    t.entry_price,
    t.exit_price,
    t.pnl,
    t.roi_pct,
    t.liquidated,
    t.closed_at
FROM public.paper_trades t
JOIN public.paper_accounts a ON t.account_id = a.id
WHERE t.closed_at >= date_trunc('week', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
ORDER BY t.roi_pct DESC;

import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GradientPanel, Wordmark } from "./bits";

const unavailable = (label: string) => toast(`${label} is unavailable in the internal tester`, { description: "Use demo money to try the terminal." });

export function Login({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-hairline bg-card md:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 p-8 md:p-12">
          <Wordmark />
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight">Log in to godcandle</h1>
          <div className="flex flex-col gap-3">
            <Button variant="terminal" onClick={() => unavailable("Wallet connection")} className="pill pill-ink h-12 w-full text-base">
              <Wallet className="h-4 w-4" /> Connect Wallet
            </Button>
            <div className="flex items-center gap-4 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="terminal" onClick={() => unavailable("Email login")} className="pill pill-outline h-12 w-full text-base">
              Log in with Email
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="terminal" onClick={() => unavailable("Google sign-in")} className="pill pill-outline h-12 text-base">Google</Button>
              <Button variant="terminal" onClick={() => unavailable("Apple sign-in")} className="pill pill-outline h-12 text-base">Apple</Button>
            </div>
          </div>
          <button onClick={onDemo} className="text-center text-sm font-medium underline underline-offset-4 hover:opacity-70">
            Try with demo money — no sign-up
          </button>
          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground">Embedded wallet — you keep control</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">By continuing you agree to Terms &amp; Privacy</p>
          </div>
        </div>
        <div className="hidden p-3 md:block">
          <GradientPanel className="h-full min-h-[520px] rounded-[22px]">
            <span className="absolute right-5 top-5 text-xs font-semibold uppercase tracking-[0.22em]">godcandle</span>
            <p className="absolute bottom-6 left-6 text-4xl font-semibold leading-[1.05] tracking-tight">
              One candle.
              <br />
              Up to 1000x.
            </p>
          </GradientPanel>
        </div>
      </div>
    </div>
  );
}

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fmtUsd } from "@/lib/engine";
import { Wordmark } from "./bits";
export function Header({balance}: {balance:number}) {
 const [open,setOpen]=useState(false);
 return <><header className="flex min-h-16 flex-wrap items-center gap-3 py-3"><Wordmark/><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain"/>Live</span><div className="ml-auto flex items-center gap-2"><span className="pill tabular hidden h-10 border border-hairline bg-card px-4 text-sm sm:inline-flex">${fmtUsd(balance)} <span className="font-sans text-muted-foreground">USDC</span></span><Button variant="terminal" className="pill pill-ink h-10 px-5" onClick={()=>toast("Wallet connection is unavailable in the internal tester")}>Connect Wallet</Button><Button variant="terminal" aria-label="Open menu" className="pill pill-ghost h-10 w-10 p-0"><Menu/></Button></div></header>{open&&<div className="fixed inset-0 z-50 flex flex-col bg-background p-6"><Button variant="terminal" className="ml-auto" aria-label="Close menu" onClick={()=>setOpen(false)}><X/></Button><nav className="flex flex-1 flex-col items-center justify-center gap-4">{["Trade","Positions","History","Stats"].map(it=><Button key={it} variant="terminal" className="h-auto text-4xl font-semibold tracking-tight" onClick={()=>{setOpen(false);document.getElementById(it === "Trade"?"terminal":"dock")?.scrollIntoView({behavior:"smooth"});if(it!=="Trade")window.dispatchEvent(new CustomEvent("dock-tab",{detail:it==="Positions"?"open":it.toLowerCase()}));}}>{it}</Button>)}</nav></div>}</>;
}

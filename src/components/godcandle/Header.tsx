import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fmtUsd } from "@/lib/engine";
import { Wordmark } from "./bits";
export function Header({balance}: {balance:number}) {
  return <header className="flex min-h-20 flex-wrap items-center gap-5 border-b border-hairline px-5 py-4 lg:px-7"><Link to="/" aria-label="godcandle home"><Wordmark/></Link><nav aria-label="Main navigation" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">{([{to:"/",label:"Trade"},{to:"/portfolio",label:"Portfolio"},{to:"/analytics",label:"Analytics"}] as const).map(item=><Link key={item.to} to={item.to} activeOptions={{exact:true}} activeProps={{className:"pill pill-ink h-10 px-5 text-sm"}} inactiveProps={{className:"pill h-10 px-5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"}}>{item.label}</Link>)}</nav><div className="ml-auto flex items-center gap-5"><div className="text-right"><p className="text-[10px] text-muted-foreground">Balance</p><p className="tabular text-sm font-semibold">${fmtUsd(balance)}</p></div><Button variant="terminal" className="pill pill-ink h-10 px-5" onClick={()=>toast("Deposits are not connected. No funds will be transferred.")}>Deposit</Button></div></header>;
}

import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TransferDialog } from "./TransferDialog";
import { fmtUsd } from "@/lib/engine";
import { Wordmark } from "./bits";
export function Header({balance}: {balance:number}) {
 const [transfer,setTransfer]=useState<"Deposit"|"Withdraw"|null>(null);
 return <><header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-hairline px-5 py-3 lg:px-7"><Link to="/" aria-label="godcandle home"><Wordmark/></Link><nav aria-label="Main navigation" className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">{([{to:"/",label:"Trade"},{to:"/portfolio",label:"Portfolio"},{to:"/analytics",label:"Analysis"},{to:"/leaderboard",label:"Leaderboard"},{to:"/staking",label:"Staking"},{to:"/candle",label:"Candle"}] as const).map(item=><Link key={item.to} to={item.to} activeOptions={{exact:true}} activeProps={{className:"pill pill-ink h-9 px-4 text-xs"}} inactiveProps={{className:"pill h-9 px-4 text-xs hover:bg-secondary"}}>{item.label}</Link>)}</nav><div className="ml-auto flex items-center gap-3"><div className="text-right"><p className="data-label">Available balance</p><p className="tabular text-base font-semibold">${fmtUsd(balance)}</p></div><Button variant="terminal" className="pill pill-ink h-9 px-4 text-xs" onClick={()=>setTransfer("Deposit")}>Deposit</Button></div></header>{transfer&&<TransferDialog mode={transfer} onClose={()=>setTransfer(null)}/>}</>;
}

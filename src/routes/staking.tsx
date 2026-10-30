import { createFileRoute } from "@tanstack/react-router";
import { StakingView } from "@/components/godcandle/StakingView";
export const Route=createFileRoute("/staking")({head:()=>({meta:[{title:"godcandle — Staking"},{name:"description",content:"CANDLE staking, USDC rewards and revenue overview."},{property:"og:title",content:"godcandle — Staking"},{property:"og:description",content:"Your CANDLE staking and USDC rewards."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Staking});
function Staking(){return <StakingView/>;}
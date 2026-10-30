// Deterministic visual market data, not external market or wallet data.
export const analysisSeries = Array.from({length:96},(_,i)=>30+i*.48+Math.sin(i*.21)*6+Math.sin(i*1.7)*2);
export const revenueSeries = Array.from({length:48},(_,i)=>i===26?112:3+(i*19)%13);
export const supplySeries = Array.from({length:80},(_,i)=>5+Math.log(i+1)*.9);
export const rewardCurve = Array.from({length:80},(_,i)=>i<28?10:Math.max(1,10*Math.exp(-(i-28)/14)));
export const leaderboardRows = Array.from({length:12},(_,i)=>({rank:i+4,address:`0x${["7c85","3806","8e47","1706","4fd0","58b2"][i%6]}…${["a08d","5c8e","f3c9","d472","2751","11f3"][i%6]}`,market:["BTC","ETH","SOL"][i%3],pnl:22541-i*935,roi:385-i*17,trades:31-i}));
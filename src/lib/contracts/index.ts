export const CONTRACT_ADDRESSES = {
  HousePool: '0x3c2718E298dDe97d19B86b1F4F944445A2594691',
  L1Read: '0x0000000000000000000000000000000000000806', // HyperCore MarkPx Precompile
  BBORead: '0x000000000000000000000000000000000000080e', // HyperCore BBO Mid Precompile
  CandleToken: '0xCANDLE0000000000000000000000000000000999',
  FeeWaterfall: '0xFEE0000000000000000000000000000000000999',
} as const;

export const HousePoolABI = [
  {
    type: 'function',
    name: 'openPosition',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'marketIndex', type: 'uint8' },
      { name: 'isLong', type: 'bool' },
      { name: 'margin', type: 'uint256' },
      { name: 'leverage', type: 'uint256' },
      { name: 'maxSlippageBps', type: 'uint16' },
    ],
    outputs: [{ name: 'positionId', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'closePosition',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'positionId', type: 'bytes32' }],
    outputs: [
      { name: 'pnl', type: 'int256' },
      { name: 'inFifoQueue', type: 'bool' },
      { name: 'fifoTicketId', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getPoolReserves',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'liquidReserves', type: 'uint256' },
      { name: 'fifoQueueDepth', type: 'uint256' },
      { name: 'openInterestLong', type: 'uint256' },
      { name: 'openInterestShort', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'claimFifoQueue',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'ticketId', type: 'uint256' }],
    outputs: [{ name: 'payout', type: 'uint256' }],
  },
] as const;

export const L1ReadABI = [
  {
    type: 'function',
    name: 'getMarkPx',
    stateMutability: 'view',
    inputs: [{ name: 'marketIndex', type: 'uint8' }],
    outputs: [{ name: 'markPrice', type: 'uint64' }],
  },
  {
    type: 'function',
    name: 'getBbo',
    stateMutability: 'view',
    inputs: [{ name: 'marketIndex', type: 'uint8' }],
    outputs: [
      { name: 'bid', type: 'uint64' },
      { name: 'ask', type: 'uint64' },
      { name: 'mid', type: 'uint64' },
    ],
  },
  {
    type: 'function',
    name: 'getClampedPrice',
    stateMutability: 'view',
    inputs: [
      { name: 'marketIndex', type: 'uint8' },
      { name: 'corridorBps', type: 'uint16' },
    ],
    outputs: [
      { name: 'execPrice', type: 'uint64' },
      { name: 'isClamped', type: 'bool' },
    ],
  },
] as const;

export const CandleTokenABI = [
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'currentEmissionRate',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'candlePerUsd', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claimStakingYield',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'usdcYield', type: 'uint256' }],
  },
] as const;

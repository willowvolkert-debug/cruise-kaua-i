// Mirrors base44/shared/fees.ts — keep the two in sync.
// Free rides (amount 0) never carry a fee.
export const carpoolConnectFee = (isLocal, rideAmount) =>
  rideAmount > 0 ? (isLocal ? 3 : 7) : 0;

export const schoolConnectFee = (rideAmount) => (rideAmount > 0 ? 1 : 0);

export const CARD_FEE_RATE = 0.03;
// Cruise Hawaiʻi connect fees. Free rides (amount 0) never carry a fee.
// Carpool + partypool: flat $3 per ride for locals, $7 for visitors.
// Schoolpool: flat $1 per ride.
export function carpoolConnectFee(isLocal: boolean, rideAmount: number): number {
  if (!(rideAmount > 0)) return 0;
  return isLocal ? 3 : 7;
}

export function schoolConnectFee(rideAmount: number): number {
  return rideAmount > 0 ? 1 : 0;
}
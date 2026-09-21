export function calculateRearCameraPitch(beta: number, gamma = 0): number {
  const betaRadians = beta * Math.PI / 180;
  const gammaRadians = gamma * Math.PI / 180;
  const verticalComponent = -Math.cos(betaRadians) * Math.cos(gammaRadians);
  return Math.asin(Math.max(-1, Math.min(1, verticalComponent))) * 180 / Math.PI;
}

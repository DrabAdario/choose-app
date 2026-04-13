/** Rotation (degrees, clockwise) so slice `index` center sits under a fixed top pointer. */
export function rotationToBringIndexToTop(index: number, segmentCount: number): number {
  const seg = 360 / segmentCount
  const centerDeg = -90 + (index + 0.5) * seg
  let r = -90 - centerDeg
  while (r < 0) r += 360
  return r % 360
}

/** Next cumulative rotation for animation: at least `fullSpins` extra turns, landing on `winnerIndex`. */
export function nextCumulativeRotation(
  currentRotation: number,
  winnerIndex: number,
  segmentCount: number,
  fullSpins: number,
): number {
  const targetMod = rotationToBringIndexToTop(winnerIndex, segmentCount)
  const currentMod = ((currentRotation % 360) + 360) % 360
  let delta = targetMod - currentMod
  if (delta <= 0) delta += 360
  return currentRotation + fullSpins * 360 + delta
}

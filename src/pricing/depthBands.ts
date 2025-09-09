/**
 * @dev Depth bands encoding/decoding functions
 */

const DEPTH_BANDS_COUNT = 30;
const DEPTH_BANDS_PER_SLOT1 = 14;

/**
 * Encode depth bands data into two uint256 slots
 * @param totalDepthUsd Total depth in USD (must fit in uint32)
 * @param bandPercentagesBps Array of 30 band percentages in basis points
 * @returns Two slots as bigints
 */
export function encodeDepthBands(
  totalDepthUsd: number,
  bandPercentagesBps: number[]
): { slot1: bigint; slot2: bigint } {
  // Pack slot1: totalDepthUsd (32 bits) + bands 0-13 (14 * 16 bits)
  let slot1 = BigInt(totalDepthUsd);

  for (let i = 0; i < DEPTH_BANDS_PER_SLOT1; i++) {
    const shift = 32 + i * 16;
    slot1 |= BigInt(bandPercentagesBps[i]) << BigInt(shift);
  }

  // Pack slot2: bands 14-29 (16 * 16 bits)
  let slot2 = BigInt(0);

  for (let i = DEPTH_BANDS_PER_SLOT1; i < DEPTH_BANDS_COUNT; i++) {
    const shift = (i - DEPTH_BANDS_PER_SLOT1) * 16;
    slot2 |= BigInt(bandPercentagesBps[i]) << BigInt(shift);
  }

  return { slot1, slot2 };
}

/**
 * Decode depth bands from two uint256 slots
 * @param slot1 First slot containing totalDepthUsd and bands 0-13
 * @param slot2 Second slot containing bands 14-29
 * @returns Total depth and array of band percentages
 */
export function decodeDepthBands(
  slot1: bigint,
  slot2: bigint
): { totalDepthUsd: number; bands: number[] } {
  const totalDepthUsd = Number(slot1 & BigInt(0xffffffff));
  const bands: number[] = [];

  // Extract bands 0-13 from slot1
  for (let i = 0; i < DEPTH_BANDS_PER_SLOT1; i++) {
    const shift = 32 + i * 16;
    bands.push(Number((slot1 >> BigInt(shift)) & BigInt(0xffff)));
  }

  // Extract bands 14-29 from slot2
  for (let i = DEPTH_BANDS_PER_SLOT1; i < DEPTH_BANDS_COUNT; i++) {
    const shift = (i - DEPTH_BANDS_PER_SLOT1) * 16;
    bands.push(Number((slot2 >> BigInt(shift)) & BigInt(0xffff)));
  }

  return { totalDepthUsd, bands };
}

/**
 * Encode depth bands mapping (global offsets for all pairs)
 * @param bands Array of 30 band offset values in ppm
 * @returns Two slots as bigints
 */
export function encodeDepthBandsMapping(bands: number[]): {
  slot1: bigint;
  slot2: bigint;
} {
  // Pack slot1: bands 0-13 (14 * 16 bits)
  let slot1 = BigInt(0);

  for (let i = 0; i < DEPTH_BANDS_PER_SLOT1; i++) {
    slot1 |= BigInt(bands[i]) << BigInt(i * 16);
  }

  // Pack slot2: bands 14-29 (16 * 16 bits)
  let slot2 = BigInt(0);

  for (let i = DEPTH_BANDS_PER_SLOT1; i < DEPTH_BANDS_COUNT; i++) {
    const shift = (i - DEPTH_BANDS_PER_SLOT1) * 16;
    slot2 |= BigInt(bands[i]) << BigInt(shift);
  }

  return { slot1, slot2 };
}

/**
 * Decode depth bands mapping from two uint256 slots
 * @param slot1 First slot containing bands 0-13
 * @param slot2 Second slot containing bands 14-29
 * @returns Array of band offset values in ppm
 */
export function decodeDepthBandsMapping(
  slot1: bigint,
  slot2: bigint
): number[] {
  const bands: number[] = [];

  // Extract bands 0-13 from slot1
  for (let i = 0; i < DEPTH_BANDS_PER_SLOT1; i++) {
    bands.push(Number((slot1 >> BigInt(i * 16)) & BigInt(0xffff)));
  }

  // Extract bands 14-29 from slot2
  for (let i = DEPTH_BANDS_PER_SLOT1; i < DEPTH_BANDS_COUNT; i++) {
    const shift = (i - DEPTH_BANDS_PER_SLOT1) * 16;
    bands.push(Number((slot2 >> BigInt(shift)) & BigInt(0xffff)));
  }

  return bands;
}
